use regex::Regex;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;

/// Streaming events emitted while whisper-cli runs. Mirrors `FfmpegEvent`
/// so transcription can be surfaced in the UI exactly like a conversion.
#[derive(Clone)]
pub enum WhisperEvent {
    /// 0.0 – 1.0 progress through the audio.
    Progress(f64),
    /// A parsed transcript segment: `[start --> end] text`.
    Segment(String),
    /// Any other log line from whisper.cpp stderr.
    Log(String),
    Done(String),
    Error(String),
}

/// Spawn whisper-cli with the given args, invoking `emit` for every event as
/// it arrives (live). This mirrors the streaming behaviour of `run_conversion`
/// so the UI progress bar advances smoothly instead of jumping 0 → 100 at the
/// end. Returns the output stem path on success (or the first error message).
///
/// `_duration` is accepted for signature symmetry with `run_conversion` but
/// unused: whisper.cpp emits its own `progress = N%` lines (when `-pp` is
/// passed), so we don't map an absolute timestamp back to a fraction.
pub fn run_whisper_streaming<F>(
    args: &[String],
    _duration: f64,
    emit: F,
    job_id: &str,
) -> Result<String, String>
where
    F: Fn(&WhisperEvent) + Send + Sync + 'static,
{
    let whisper = crate::whisper::whisper_path();
    let mut cmd = Command::new(whisper);
    cmd.args(args)
        .stderr(Stdio::piped())
        .stdout(Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn whisper-cli: {}", e))?;

    // Register the child's pid so `cancel_transcription` / `kill_job` can kill
    // exactly this process (not every whisper-cli.exe on the machine).
    crate::queue::pids::register_pid(job_id, child.id());

    // whisper.cpp writes segment output to stdout and progress to stderr.
    let stderr = child.stderr.take().unwrap();
    let stdout = child.stdout.take().unwrap();

    let progress_re = Regex::new(r"progress\s*=\s*(\d+)\s*%").unwrap();
    // Segment lines look like: "[00:00:00.000 --> 00:00:03.500]  Hello world"
    let segment_re = Regex::new(r"^\[\d{2}:\d{2}:\d{2}\.\d+\s*-->\s*\d{2}:\d{2}:\d{2}\.\d+\]").unwrap();
    // Detected-language line: `language = "en"` or `language = en`
    let lang_re = Regex::new(r#"language\s*=\s*"?([a-zA-Z]{2})"?"#).unwrap();

    // Channel the reader threads push events onto; the main loop drains them
    // and calls `emit` while waiting for the child to exit.
    let (tx, rx) = mpsc::channel::<WhisperEvent>();

    // stderr reader: progress + detected language + error scanning.
    let tx_err = tx.clone();
    let progress_re_err = progress_re.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            if line.is_empty() {
                continue;
            }
            if let Some(caps) = progress_re_err.captures(&line) {
                let pct: f64 = caps[1].parse().unwrap_or(0.0);
                let _ = tx_err.send(WhisperEvent::Progress(pct / 100.0));
            }
            if let Some(caps) = lang_re.captures(&line) {
                let _ = tx_err.send(WhisperEvent::Log(format!("detected: {}", &caps[1])));
            }
            if line.to_lowercase().contains("error") {
                let _ = tx_err.send(WhisperEvent::Error(line.clone()));
            }
            // Most stderr lines are useful context; surface them as logs.
            if !progress_re_err.is_match(&line) && !lang_re.is_match(&line) {
                let _ = tx_err.send(WhisperEvent::Log(line));
            }
        }
    });

    // stdout reader: segment lines become transcript output.
    let tx_out = tx.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        let mut buffer = String::new();
        for line in reader.lines().flatten() {
            if segment_re.is_match(&line) {
                // Flush the previous segment if one was being accumulated.
                if !buffer.is_empty() {
                    let _ = tx_out.send(WhisperEvent::Segment(std::mem::take(&mut buffer)));
                }
                buffer = line;
            } else if !buffer.is_empty() {
                // Continuation of the current segment.
                buffer.push('\n');
                buffer.push_str(&line);
            } else {
                let _ = tx_out.send(WhisperEvent::Log(line));
            }
        }
        if !buffer.is_empty() {
            let _ = tx_out.send(WhisperEvent::Segment(buffer));
        }
    });

    // Drop the sender we still hold so the channel closes when both readers
    // finish (which happens as the child exits and closes its pipes).
    drop(tx);

    // Drain events live: `rx.iter()` blocks until an event arrives or the
    // channel closes, then yields the next. Because the readers only finish
    // when whisper-cli's stdout/stderr close (i.e. it has exited), this loop
    // naturally terminates right as the process does — and every progress /
    // log / segment event is forwarded to `emit` the instant it's produced.
    let mut had_error: Option<String> = None;
    for ev in rx.iter() {
        if let WhisperEvent::Error(ref msg) = ev {
            if had_error.is_none() {
                had_error = Some(msg.clone());
            }
        }
        emit(&ev);
    }

    // If the job was cancelled (pid already killed by kill_job), surface that
    // as the error instead of a confusing exit code.
    if crate::queue::pids::is_cancelled(job_id) {
        crate::queue::pids::unregister(job_id);
        return Err("transcription cancelled".to_string());
    }

    let status = child
        .wait()
        .map_err(|e| format!("Failed to wait on whisper-cli: {}", e))?;

    // The job is no longer running — drop its pid / token so the registry
    // doesn't grow without bound and cancel_job can't target a dead process.
    crate::queue::pids::unregister(job_id);

    if status.success() {
        // The output file path is the argument immediately following `-of`,
        // if present; otherwise fall back to the input's sibling path.
        let output_path = args
            .iter()
            .position(|a| a == "-of")
            .and_then(|i| args.get(i + 1))
            .cloned()
            .unwrap_or_default();
        Ok(output_path)
    } else {
        Err(had_error.unwrap_or_else(|| format!("whisper-cli exited with code: {}", status)))
    }
}

/// Buffering variant of [`run_whisper_streaming`]: runs whisper-cli and
/// collects every event into a `Vec`, returning them all at once. Used by the
/// one-shot `detect_spoken_language` command, which only needs the final
/// result and has no UI to stream into. For anything user-facing, prefer the
/// streaming variant so the progress bar updates live.
pub fn run_whisper(args: &[String], duration: f64) -> Result<Vec<WhisperEvent>, String> {
    use std::sync::{Arc, Mutex};
    let collected: Arc<Mutex<Vec<WhisperEvent>>> = Arc::new(Mutex::new(Vec::new()));
    let collected_for_cb = Arc::clone(&collected);
    let path = run_whisper_streaming(args, duration, move |ev| {
        if let Ok(mut buf) = collected_for_cb.lock() {
            buf.push(ev.clone());
        }
    }, "detect-language")?;
    let mut events = Arc::try_unwrap(collected)
        .map(|m| m.into_inner().unwrap_or_default())
        .unwrap_or_default();
    events.push(WhisperEvent::Done(path));
    Ok(events)
}

/// Verify that whisper-cli is available.
///
/// We avoid actually invoking the binary: whisper-cli reads from stdin when
/// given no/`-h` args, which hangs the process. A presence check on the
/// resolved path is sufficient and instant.
pub fn detect_whisper() -> bool {
    let path = crate::whisper::whisper_path();
    path.exists()
}

