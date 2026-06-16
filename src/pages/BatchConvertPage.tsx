import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import CustomSelect from "../components/CustomSelect";
import ScrambleText from "../components/ScrambleText";
import type { ScannedFile, BatchProgress } from "../types";

const EXT_OPTIONS = [
  { value: "mp4", label: ".mp4", type: "video" as const },
  { value: "mkv", label: ".mkv", type: "video" as const },
  { value: "avi", label: ".avi", type: "video" as const },
  { value: "mov", label: ".mov", type: "video" as const },
  { value: "webm", label: ".webm", type: "video" as const },
  { value: "mp3", label: ".mp3", type: "audio" as const },
  { value: "flac", label: ".flac", type: "audio" as const },
  { value: "wav", label: ".wav", type: "audio" as const },
  { value: "png", label: ".png", type: "image" as const },
  { value: "jpg", label: ".jpg", type: "image" as const },
  { value: "webp", label: ".webp", type: "image" as const },
];

const FMT_OPTIONS = [
  { value: "mp4", label: "mp4", type: "video" as const },
  { value: "mkv", label: "mkv", type: "video" as const },
  { value: "avi", label: "avi", type: "video" as const },
  { value: "mov", label: "mov", type: "video" as const },
  { value: "webm", label: "webm", type: "video" as const },
  { value: "mp3", label: "mp3", type: "audio" as const },
  { value: "flac", label: "flac", type: "audio" as const },
  { value: "wav", label: "wav", type: "audio" as const },
  { value: "png", label: "png", type: "image" as const },
  { value: "jpeg", label: "jpeg", type: "image" as const },
  { value: "webp", label: "webp", type: "image" as const },
];

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function BatchConvertPage() {
  const [inputDir, setInputDir] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [inputExt, setInputExt] = useState("mp4");
  const [outputFmt, setOutputFmt] = useState("mp4");
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pickInput = async () => {
    const sel = await open({ directory: true, multiple: false });
    if (sel) setInputDir(sel as string);
  };

  const pickOutput = async () => {
    const sel = await open({ directory: true, multiple: false });
    if (sel) setOutputDir(sel as string);
  };

  const scan = useCallback(async () => {
    if (!inputDir) return;
    setScanning(true);
    setError(null);
    setFiles([]);
    try {
      const result = await invoke<ScannedFile[]>("scan_directory", {
        dir: inputDir,
        extension: inputExt,
      });
      setFiles(result);
      setLog((p) => [...p, `> scanned ${result.length} files`]);
    } catch (e) {
      setError(String(e));
      setLog((p) => [...p, `! scan failed: ${e}`]);
    } finally {
      setScanning(false);
    }
  }, [inputDir, inputExt]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    (async () => {
      unlisten = await listen<BatchProgress>("batch-progress", (e) => {
        setProgress(e.payload);
      });
    })();
    return () => { if (unlisten) unlisten(); };
  }, []);

  const convertAll = useCallback(async () => {
    if (!inputDir || !outputDir || files.length === 0) return;
    setConverting(true);
    setError(null);
    setLog(["> batch start"]);
    setProgress(null);
    try {
      await invoke("start_batch_conversion", {
        params: {
          input_dir: inputDir,
          output_dir: outputDir,
          input_extension: inputExt,
          output_format: outputFmt,
        },
      });
      setLog((p) => [...p, "> batch done"]);
    } catch (e) {
      setError(String(e));
      setLog((p) => [...p, `! ${e}`]);
    } finally {
      setConverting(false);
    }
  }, [inputDir, outputDir, inputExt, outputFmt, files]);

  const canScan = !!inputDir && !scanning;
  const canConvert = !!inputDir && !!outputDir && files.length > 0 && !converting;

  return (
    <div className="page">
      <h2>ᚷ batch convert</h2>

      {!inputDir && (
        <div className="alert-error">! select an input folder to begin</div>
      )}

      <div className="card">
        <label className="label">input folder</label>
        <div className="row">
          <input className="input" value={inputDir} placeholder="browse for source folder..." readOnly />
          <button className="btn" onClick={pickInput}>browse</button>
        </div>
      </div>

      <div className="card">
        <label className="label">output folder</label>
        <div className="row">
          <input className="input" value={outputDir} placeholder="browse for destination folder..." readOnly />
          <button className="btn" onClick={pickOutput}>browse</button>
        </div>
      </div>

      <div className="batch-format-row">
        <div className="card batch-card">
          <label className="label">input extension</label>
          <CustomSelect
            options={EXT_OPTIONS}
            value={inputExt}
            onChange={setInputExt}
          />
        </div>
        <div className="card batch-card">
          <label className="label">output format</label>
          <CustomSelect
            options={FMT_OPTIONS}
            value={outputFmt}
            onChange={setOutputFmt}
          />
        </div>
      </div>

      <button className="btn btn-primary" disabled={!canScan} onClick={scan}>
        {scanning ? "scanning..." : <ScrambleText text="scan folder" hover ticks={4} />}
      </button>

      {files.length > 0 && (
        <div className="batch-file-list">
          <div className="batch-file-hdr">
            <span className="batch-file-count">{files.length} file{files.length !== 1 ? "s" : ""}</span>
          </div>
          {files.map((f, i) => (
            <div key={i} className="batch-file-row">
              <span className="batch-file-name">{f.name}</span>
              <span className="batch-file-size">{fmtSize(f.size)}</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button className="btn btn-primary" disabled={!canConvert} onClick={convertAll}>
          {converting ? "converting..." : <ScrambleText text={`convert ${files.length} file${files.length !== 1 ? "s" : ""}`} hover ticks={4} />}
        </button>
      )}

      {progress && (
        <div className="card">
          <label className="label">progress</label>
          <div className="batch-progress-info">
            {progress.done + progress.failed} / {progress.total} files
            {progress.failed > 0 && ` (${progress.failed} failed)`}
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${((progress.done + progress.failed) / progress.total) * 100}%` }}
            />
          </div>
          {progress.current_file && (
            <div className="batch-current-file">{progress.current_file}</div>
          )}
          {progress.file_progress > 0 && progress.file_progress < 1 && (
            <div className="progress-bar-container" style={{ height: 3, marginTop: 4 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${progress.file_progress * 100}%`,
                  background: "var(--fg-dim)",
                }}
              />
            </div>
          )}
        </div>
      )}

      {error && <div className="alert-error">! {error}</div>}

      {log.length > 0 && (
        <div className="log-panel">
          {log.map((l, i) => <div key={i} className="log-line">{l}</div>)}
        </div>
      )}
    </div>
  );
}
