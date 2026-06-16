# ᚷᚨᛚᛞᚱ — Build Plan: Media Forge

ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛝ ᛟ ᛞ

---

## 1. Concept

**galdr** is a desktop GUI wrapper around FFmpeg (and eventually other CLI media tools) for converting and manipulating video, audio, and images. The name "galdr" (Old Norse for "magical incantation") frames each conversion as a transformation — raw media in, enchanted media out.

The retro runic theme from the style guide fits naturally: a dark terminal-like workspace where the user assembles commands and FFmpeg executes them.

---

## 2. Feature Roadmap

### Phase 1 — Core (FFmpeg + ffprobe)

**Conversion**
- Video: MP4, MKV, AVI, MOV, WebM, GIF
- Audio: MP3, FLAC, WAV, AAC, OGG, OPUS
- Image: PNG, JPEG, WebP, BMP, TIFF
- Preset profiles for common targets (e.g., "H.264 YouTube", "H.265 Archive", "MP3 320kbps")

**Video operations**
- Trim / split by time range
- Concatenate multiple clips
- Extract audio track
- Resize / change resolution with aspect-ratio lock
- Crop (interactive preview)
- Change frame rate
- Extract frames as images (spritesheet or individual)
- Speed up / slow down (preserve or drop audio pitch)
- Rotate / flip

**Audio operations**
- Change codec, sample rate, bitrate, channel count
- Normalize volume (EBU R128 or peak)
- Trim / split by time
- Concatenate tracks
- Fade in / fade out

**Image operations**
- Format conversion (with quality slider for lossy formats)
- Resize (by dimensions or percentage)
- Crop

**Media info panel** (via ffprobe)
- Codec, resolution, bitrate, duration, frame rate, audio channels, metadata

### Phase 2 — Advanced FFmpeg

- Scene detection + auto-split
- Subtitle burn-in / extraction
- Watermark overlay (image + text)
- Chroma key / green screen
- Video stabilization (vidstab)
- GIF creation from video (palette optimization)
- Audio mixing (overlay multiple tracks)
- Side-by-side / compare output
- Queue management with parallel/consecutive execution

### Phase 3 — Plugin expansion

- yt-dlp integration (download media from URLs)
- ImageMagick integration (advanced image ops: color curves, dithering, format-specific tweaks)
- SoX integration (advanced audio effects: reverb, pitch shift, chorus)
- NVENC / AMD AMF / Intel QSV hardware acceleration detection and toggle

---

## 3. Differentiating Features (The "Galdr" Touch)

### 3.1 Command Alchemy

The central workspace shows the raw FFmpeg command being built in real time as the user tweaks settings. Every slider, dropdown, and toggle updates the command string immediately. Hovering or clicking a flag shows a brief explanation (like a man page excerpt rendered inline).

This demystifies FFmpeg for intermediate users and serves as a learning tool for power users. The command preview can be copied to clipboard or exported as a script.

**UI:** A fixed-bottom terminal-style panel showing the full command with syntax-highlighted flags.

### 3.2 Rune Tags

Users can save conversion presets as named "runes" — reusable incantations with custom rune icons and names. Bundled examples:

| Rune | Name   | Preset                                 |
|------|--------|----------------------------------------|
| ᚠ    | Fehu   | Archive: H.265 CRF 18, FLAC audio      |
| ᚲ    | Kaunan | Web: H.264 CRF 23, AAC 128k, 1080p cap |
| ᛏ    | Tiwaz  | YouTube: H.264 CRF 21, AAC 192k, 60fps |
| ᛞ    | Dagaz  | Discord: H.264 CRF 28, AAC 96k, 720p   |

Rune Tags sync to disk as simple JSON files so they are portable and editable by hand.

### 3.3 Batch Pattern Matching

Users can process folders with glob-like patterns. Examples:

- `*.mp4` — trim first 30 seconds off every MP4
- `*_hq.*` — compress everything tagged `_hq` to 720p
- `screenshot_*.png` — convert all screenshots to JPEG at 85% quality

The UI shows a preview table of matched files before execution.

### 3.4 Side-by-Side Diff

A comparison view for before/after results:

- **Video:** Two players side-by-side with synchronized playback (play, pause, seek together) and a splitter slider for wipe comparison.
- **Audio:** Overlaid waveform visualization with a draggable split point.
- **Images:** Side-by-side with synchronized zoom/pan and a pixel-difference overlay mode.

### 3.5 Dependency-Free Portable Mode

Bundle a static `ffmpeg.exe` inside the application resources. On first launch, if FFmpeg is not found on the system PATH, galdr extracts its bundled copy and uses it transparently. This means:

- Zero configuration for end users
- Consistent, tested FFmpeg version
- Works fully offline
- Can run from a USB drive

The bundled FFmpeg is detected and reported in the settings panel, alongside any system-installed version.

### 3.6 Auto-Detect Best Settings

When a source file is loaded, galdr runs `ffprobe` and analyzes the media. It then suggests optimized output settings with an explanation:

> **Source:** 4K HDR 60fps, 85 Mbps, H.265
> **Recommendation:** 1080p SDR, 30fps, CRF 23, H.265, AAC 192k
> **Estimated saving:** ~78% file size (85 Mbps → 18 Mbps)

The user can accept, tweak, or ignore the suggestion. The heuristic considers:
- Resolution vs. display size
- Frame rate (60fps content → 30fps or 60fps option)
- HDR to SDR tonemapping when needed
- Codec selection (H.264 for compatibility, H.265 for size)
- Audio downmixing (5.1 → stereo when appropriate)

### 3.7 Watch Folder

Users can designate a folder for galdr to monitor. When new files appear matching defined patterns, they are automatically added to the queue with a selected Rune Tag preset.

- Recursive or flat monitoring
- Debounce window (default 10s after file appears stable)
- Tray icon with status indicator
- Can run minimized / background

---

## 4. Architecture

```text
+-------------------------------------------------------------+
|  Tauri Shell (Rust)                                          |
|  +-------------------------------------------------------+   |
|  |  Tauri Commands (IPC layer)                           |   |
|  |  - convert(), trim(), crop(), get_media_info()        |   |
|  |  - cancel_job(), list_queue(), save_rune_tag()        |   |
|  |  - detect_hardware(), auto_detect_settings()          |   |
|  |  - watch_folder_start(), watch_folder_stop()          |   |
|  +-------------------------------------------------------+   |
|  |  FfmpegManager                                         |   |
|  |  - Builds CLI arguments (builder module)               |   |
|  |  - Spawns child processes (runner module)              |   |
|  |  - Parses stderr for progress (time=, frame=, fps=)    |   |
|  |  - Emits events (progress, complete, failed)           |   |
|  +-------------------------------------------------------+   |
|  |  JobQueue                                              |   |
|  |  - FIFO queue with optional parallel limit             |   |
|  |  - Persists to disk (resume on restart)                |   |
|  +-------------------------------------------------------+   |
|  |  FfprobeReader                                         |   |
|  |  - Parses ffprobe JSON output into MediaInfo struct    |   |
|  +-------------------------------------------------------+   |
|  |  WatchFolderManager                                    |   |
|  |  - Uses notify-rs crate for filesystem events          |   |
|  |  - Debounce, pattern matching, auto-enqueue            |   |
|  +-------------------------------------------------------+   |
|  |  RuneTagStore                                          |   |
|  |  - Loads/saves rune presets as JSON files              |   |
|  +-------------------------------------------------------+   |
|  |  FfmpegDetector                                        |   |
|  |  - Checks PATH, then bundled resources                 |   |
|  |  - Reports version, available encoders                 |   |
|  +-------------------------------------------------------+   |
+-------------------------------------------------------------+
|  React Frontend (TypeScript)                                 |
|  +-------------------------------------------------------+   |
|  |  Pages / Views                                        |   |
|  |  - ConvertPage (drag-drop zone + settings panel)      |   |
|  |  - InfoPage (media inspector via ffprobe)             |   |
|  |  - QueuePage (job list + progress)                    |   |
|  |  - RunesPage (manage saved presets)                   |   |
|  |  - DiffPage (side-by-side comparison)                 |   |
|  |  - SettingsPage (ffmpeg path, accel, theme)           |   |
|  +-------------------------------------------------------+   |
|  |  Core Components                                      |   |
|  |  - FileDropZone, FormatSelector, QualitySlider        |   |
|  |  - PresetDropdown, ProgressBar (terminal-style)       |   |
|  |  - CommandPreview (live CLI display), MediaPreview    |   |
|  |  - TrackList, JobCard, RuneDivider, AutoDetectCard    |   |
|  |  - SideBySidePlayer, WaveformOverlay, WatchFolderCfg  |   |
|  +-------------------------------------------------------+   |
|  |  State (Zustand)                                       |   |
|  |  - activeJobs, queue, runeTags, settings,             |   |
|  |    conversionParams, autoDetectSuggestion              |   |
|  +-------------------------------------------------------+   |
+-------------------------------------------------------------+
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| FFmpeg binding | Spawn child process (`std::process::Command`) | No Rust FFI bindings cover all flags; subprocess is industry standard |
| Progress reporting | Parse stderr with regex on `time=` | FFmpeg outputs progress to stderr in predictable format |
| State management | Zustand | Lightweight, minimal boilerplate, excellent React 19 support |
| File picker | Tauri dialog plugin | Native OS file dialogs, already available in Tauri 2 |
| Rune storage | JSON files in `%APPDATA%/galdr/runes/` | Portable, human-editable, easy to back up |
| Queue persistence | JSON file in `%APPDATA%/galdr/queue.json` | Simple, no DB overhead, survives crashes |
| Watch folder | `notify-rs` crate | Cross-platform, mature, debounce support built-in |
| Syntax highlighting | Prism.js or custom lightweight highlighter | For the Command Alchemy panel — only need to highlight FFmpeg flag syntax |

---

## 5. Directory Structure

```text
galdr/
+-- src/                              # React frontend
|   +-- main.tsx
|   +-- App.tsx
|   +-- App.css
|   +-- components/
|   |   +-- Layout.tsx
|   |   +-- Sidebar.tsx
|   |   +-- FileDropZone.tsx
|   |   +-- FormatSelector.tsx
|   |   +-- QualitySlider.tsx
|   |   +-- PresetDropdown.tsx
|   |   +-- ProgressBar.tsx
|   |   +-- CommandPreview.tsx        # Live CLI command display
|   |   +-- MediaPreview.tsx
|   |   +-- TrackList.tsx
|   |   +-- JobCard.tsx
|   |   +-- RuneDivider.tsx
|   |   +-- AutoDetectCard.tsx        # Shows suggested settings
|   |   +-- SideBySidePlayer.tsx      # Video/audio comparison
|   |   +-- WaveformOverlay.tsx       # Audio diff visualization
|   |   +-- WatchFolderConfig.tsx     # Folder monitoring settings
|   |   +-- RuneTagEditor.tsx         # Create/edit rune presets
|   +-- pages/
|   |   +-- ConvertPage.tsx
|   |   +-- InfoPage.tsx
|   |   +-- QueuePage.tsx
|   |   +-- RunesPage.tsx
|   |   +-- DiffPage.tsx
|   |   +-- SettingsPage.tsx
|   +-- hooks/
|   |   +-- useMediaInfo.ts
|   |   +-- useConversion.ts
|   |   +-- useQueue.ts
|   |   +-- useRuneTags.ts
|   |   +-- useAutoDetect.ts
|   |   +-- useWatchFolder.ts
|   +-- store/
|   |   +-- index.ts                  # Zustand store
|   +-- types/
|   |   +-- index.ts                  # All TypeScript interfaces
|   +-- utils/
|   |   +-- formats.ts               # Format/codec mappings
|   |   +-- presets.ts               # Built-in presets
|   |   +-- autoDetect.ts            # Client-side suggestion logic
|   |   +-- ffmpegSyntax.ts          # Flag definitions for help tooltips
|   +-- assets/
|   |   +-- runes.svg
|   +-- styles/
|       +-- retro.css                # CRT scan-line, terminal theme
|       +-- runes.css                # Rune typography classes
+-- src-tauri/
|   +-- src/
|   |   +-- main.rs
|   |   +-- lib.rs
|   |   +-- commands/
|   |   |   +-- mod.rs
|   |   |   +-- convert.rs
|   |   |   +-- info.rs
|   |   |   +-- queue.rs
|   |   |   +-- rune_tags.rs
|   |   |   +-- settings.rs
|   |   |   +-- watch.rs
|   |   |   +-- detect.rs            # Auto-detect + hardware detection
|   |   +-- ffmpeg/
|   |   |   +-- mod.rs
|   |   |   +-- builder.rs           # CLI argument builder
|   |   |   +-- runner.rs            # Process spawn + progress parsing
|   |   |   +-- probe.rs             # ffprobe JSON parser
|   |   +-- queue/
|   |   |   +-- mod.rs
|   |   |   +-- manager.rs
|   |   |   +-- persistence.rs       # Save/load queue from disk
|   |   +-- models/
|   |   |   +-- mod.rs
|   |   |   +-- conversion.rs
|   |   |   +-- media_info.rs
|   |   |   +-- rune_tag.rs
|   |   |   +-- job.rs
|   |   +-- watch/
|   |   |   +-- mod.rs
|   |   |   +-- folder_watcher.rs    # notify-rs based watcher
|   |   +-- resources/
|   |       +-- ffmpeg.exe           # Bundled portable FFmpeg
|   +-- build.rs
|   +-- Cargo.toml
|   +-- tauri.conf.json
|   +-- capabilities/
|       +-- default.json
+-- docs/
|   +-- STYLE_GUIDE.md
|   +-- PLAN.md                      # This file
+-- package.json
+-- tsconfig.json
+-- tsconfig.node.json
+-- vite.config.ts
+-- README.md
```

---

## 6. Rust Backend — Key Types

```rust
// models/conversion.rs
struct ConversionParams {
    input_paths: Vec<PathBuf>,
    output_dir: PathBuf,
    output_format: String,
    video_codec: Option<String>,
    audio_codec: Option<String>,
    video_bitrate: Option<String>,
    audio_bitrate: Option<String>,
    resolution: Option<(u32, u32)>,
    framerate: Option<f64>,
    sample_rate: Option<u32>,
    channels: Option<u8>,
    crop: Option<(u32, u32, u32, u32)>,
    trim_start: Option<f64>,
    trim_end: Option<f64>,
    speed: Option<f64>,
    crf: Option<u8>,
    preset: Option<String>,
    hardware_accel: bool,
}

// models/job.rs
enum JobStatus { Queued, Running, Completed, Failed(String) }

struct Job {
    id: Uuid,
    params: ConversionParams,
    status: JobStatus,
    progress: f64,
    created_at: DateTime<Utc>,
    rune_tag: Option<String>,
}

// models/media_info.rs
struct MediaInfo {
    container: String,
    streams: Vec<StreamInfo>,
    duration: f64,
    bitrate: Option<u64>,
    size: u64,
}

struct StreamInfo {
    index: u32,
    kind: StreamKind,          // Video, Audio, Subtitle
    codec: String,
    width: Option<u32>,
    height: Option<u32>,
    frame_rate: Option<f64>,
    sample_rate: Option<u32>,
    channels: Option<u8>,
    bitrate: Option<u64>,
    language: Option<String>,
}

// models/rune_tag.rs
struct RuneTag {
    name: String,
    rune: char,                // egyf
    description: String,
    params: ConversionParams,
}
```

---

## 7. FFmpeg Command Builder Logic

The builder module in Rust constructs FFmpeg CLI arguments from `ConversionParams`. It handles:

- Input file ordering for concatenation
- Output flag ordering (FFmpeg is flag-order sensitive)
- Codec selection with hardware acceleration fallback
- Stream mapping (select specific audio/video tracks)
- Complex filter graphs (crop + resize + framerate in single pass)

**Example generated command:**

```sh
ffmpeg -i input.mp4 \
  -c:v h264_nvenc -preset p7 -crf 23 \
  -c:a aac -b:a 192k \
  -vf "crop=1920:1080:0:0,scale=1280:720,fps=30" \
  -ss 00:01:30 -to 00:04:00 \
  -y output.mp4
```

The Command Alchemy panel in the frontend renders this string with syntax highlighting (flags in one color, values in another, file paths in a third).

---

## 8. Edge Cases & Constraints

| Concern | Mitigation |
|---------|-----------|
| FFmpeg not installed | Auto-extract bundled portable FFmpeg on first launch; show path in settings |
| Very large files (4K, 8K) | Stream input, never load into memory; show estimated output size; warn on low disk space |
| Long-running jobs / app close | Save queue state to disk every change; graceful process cleanup on close |
| Invalid input files | Validate via ffprobe before enqueue; surface stderr in readable error panel |
| Unicode filenames | `PathBuf` throughout; test with CJK, Cyrillic, Arabic, emoji-adjacent characters |
| Parallel jobs resource exhaustion | Configurable max parallel (default 1); detect RAM and warn |
| Hardware acceleration absent | Graceful fallback to software; show detected encoders in settings |
| Output file already exists | Auto-rename with numeric suffix (`output_1.mp4`) or prompt per job |
| Watch folder file locking | Debounce + verify file is not being written (size stable check) |
| Bundled ffmpeg.exe license | FFmpeg is LGPL/GPL; bundle a static build from gyan.dev; include license in about dialog |

---

## 9. Implementation Order

| Step | Feature | Depends On |
|------|---------|------------|
| 1 | Rust scaffolding: commands module, builder, runner, probe | Nothing |
| 2 | Basic convert page (single file, format selector, start button) | Step 1 |
| 3 | Progress display + event streaming to frontend | Step 1 |
| 4 | Media info page (ffprobe results) | Step 1 |
| 5 | Trim/crop/resize settings panel | Step 2 |
| 6 | Job queue with persistence | Step 3 |
| 7 | Command Alchemy live preview | Step 2 |
| 8 | Auto-detect best settings | Step 4 |
| 9 | Rune Tags (save/load presets) | Step 2 |
| 10 | Batch pattern matching | Step 6 |
| 11 | Side-by-side diff view | Step 3 |
| 12 | Portable FFmpeg bundling | Nothing (parallel) |
| 13 | Watch folder | Step 6 |
| 14 | Settings page (hardware accel, theme, ffmpeg path) | Step 12 |
| 15 | Phase 2 features (stabilization, subtitles, etc.) | Step 6 |

---

## 10. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2 |
| Frontend | React 19 + TypeScript |
| Build tool | Vite 7 |
| State | Zustand |
| Styling | Pure CSS (no framework — follows black-and-white retro mandate) |
| Backend | Rust (edition 2021) |
| FFmpeg interaction | Child process + stderr parsing |
| File watching | `notify-rs` |
| Serialization | `serde` + `serde_json` |
| UUID | `uuid` crate |
| Datetime | `chrono` crate |
| Dialogs | Tauri dialog plugin |
| Bundled FFmpeg | Static build from gyan.dev (Windows) |

---

*ᛗᛁᛚᛚᛁᚾ ᚨᛚᛚᛏ ᛖᚱ ᛏᚨᚲᚾᚨᛞᛟᛉ ᛏᛁᛚ ᛒᛖᛋᛏᚨᛞᚨᚱ*
