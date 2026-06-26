# ᚷᚨᛚᛞᚱ — Architecture Reference

> **Purpose:** This document is the single source of truth for AI agents working in the galdr repository. Read this file before making any changes. Update it after making any change that affects structure, patterns, or conventions.
>
> **Last verified:** 2026-06-26 (v0.3.2)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [State Management](#6-state-management)
7. [IPC / Tauri Commands](#7-ipc--tauri-commands)
8. [Event System](#8-event-system)
9. [Background Queue](#9-background-queue)
10. [Data Persistence](#10-data-persistence)
11. [Key Patterns & Conventions](#11-key-patterns--conventions)
12. [Known Issues & Tech Debt](#12-known-issues--tech-debt)
13. [Build & Deploy](#13-build--deploy)

---

## 1. Project Overview

**galdr** (Old Norse: "magical incantation") is a desktop GUI wrapper around FFmpeg for converting, compressing, transcribing, and editing video, audio, and image files. It uses a monochrome terminal aesthetic with Elder Futhark runes as decorative elements.

- **Author:** Ellio (github.com/ellipog)
- **License:** MIT
- **Current version:** 0.3.2 (note: `package.json` and `Cargo.toml` still read 0.2.5 — see [Known Issues](#12-known-issues--tech-debt))
- **Website:** galdr.app (planned)

### Core Capabilities

| Tool | Page | Description |
|------|------|-------------|
| Convert | `ConvertPage` | Single-file and batch format conversion |
| Compress | `CompressPage` | Quality-based and target-size compression |
| Forge | `ForgePage` | Multi-track timeline video editor |
| Subtitles | `SubtitlesPage` | AI transcription, burn-in, embed, extract, edit |
| Watch | `WatchFoldersPage` | Folder monitoring with auto-convert or queue |
| Runes | `RunesPage` | Saved conversion presets ("rune tags") |
| Settings | `SettingsPage` | App preferences and configuration |

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop shell | Tauri 2 | 2.x |
| Frontend framework | React | 19.1.0 |
| Language | TypeScript | 5.8.3 |
| Build tool | Vite | 7.0.4 |
| State management | Zustand | 5.x |
| Animation | Framer Motion | 12.40.0 |
| Package manager | Bun | ≥ 1.x |
| Backend language | Rust | edition 2021 |
| Media engine | FFmpeg | bundled static |
| Transcription | whisper.cpp (whisper-cli) | bundled |
| Filesystem watching | notify-rs | 6.x |
| Discord RPC | discord-rich-presence | 1.x |
| HTTP client | reqwest (rustls-tls, blocking) | 0.12 |
| Async runtime | tokio | 1.x |
| Serialization | serde + serde_json | 1.x |

### Tauri Plugins

- `tauri-plugin-dialog` — native file dialogs
- `tauri-plugin-single-instance` — single-instance enforcement
- `tauri-plugin-updater` — in-app update checks
- `tauri-plugin-autostart` — OS login launch
- `tauri-plugin-opener` — open files/URLs with default app

---

## 3. Directory Structure

```
galdr/
├── docs/
│   ├── ARCHITECTURE.md      ← You are here
│   ├── AGENTS.md             ← Rules for AI agents
│   ├── PLAN.md               ← Original build plan / roadmap
│   └── STYLE_GUIDE.md        ← Visual design system spec
│
├── src/                      # React frontend
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root shell: titlebar, nav, routing, context menu
│   ├── App.css               # Global styles
│   ├── components/
│   │   ├── forge/            #   Forge editor sub-components
│   │   │   ├── Timeline.tsx
│   │   │   ├── VideoPreview.tsx
│   │   │   ├── SourceBrowser.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── whisper/          #   Whisper model manager
│   │   │   └── ModelManager.tsx
│   │   ├── ScrambleText.tsx  #   Rune-scramble animation
│   │   ├── CommandPreview.tsx #   Live FFmpeg command preview
│   │   ├── MediaPreview.tsx  #   In-app video/image playback
│   │   ├── TranscriptEditor.tsx
│   │   ├── SubtitleStylePanel.tsx
│   │   ├── QueueDropdown.tsx #   Titlebar queue indicator
│   │   ├── UpdateBanner.tsx  #   In-app update UI
│   │   ├── ContextMenu.tsx   #   Right-click context menu
│   │   ├── LogPanel.tsx      #   Real-time FFmpeg output
│   │   ├── MediaInfoCard.tsx #   Media metadata display
│   │   ├── ConvertOperations.tsx
│   │   ├── CompressionControls.tsx
│   │   ├── ExtractFramesPanel.tsx
│   │   ├── PresetPicker.tsx
│   │   ├── RuneTagEditor.tsx
│   │   ├── RuneImportPreview.tsx
│   │   ├── QualitySlider.tsx
│   │   ├── CustomSelect.tsx
│   │   ├── Dropdown.tsx
│   │   ├── VideoComparison.tsx
│   │   ├── ImageComparison.tsx
│   │   └── AudioComparison.tsx
│   ├── pages/
│   │   ├── HomePage.tsx      #   Tool selection cards
│   │   ├── ConvertPage.tsx
│   │   ├── CompressPage.tsx
│   │   ├── ForgePage.tsx
│   │   ├── SubtitlesPage.tsx
│   │   ├── RunesPage.tsx
│   │   ├── WatchFoldersPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/
│   │   ├── index.ts          #   Main Zustand store
│   │   ├── forgeStore.ts     #   Forge editor state
│   │   ├── queueStore.ts     #   Background queue state
│   │   ├── watchStore.ts     #   Watch folder state
│   │   └── subtitleStore.ts  #   Subtitle editor state
│   ├── types/
│   │   └── index.ts          #   All TypeScript interfaces
│   ├── utils/
│   │   ├── ffmpegBuilder.ts  #   Frontend FFmpeg command builder
│   │   ├── ffmpegSyntax.ts   #   Syntax highlighting definitions
│   │   ├── runeMerge.ts      #   Rune import/export merging
│   │   └── srt.ts            #   SRT/VTT parsing utilities
│   ├── options.ts            #   Format/codec option lists
│   ├── options/languages.ts  #   Whisper language options
│   └── transitions.tsx       #   Page transition animations + definitions
│
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           #   Rust entry point (calls galdr_lib::run)
│   │   ├── lib.rs            #   Tauri setup, plugins, invoke_handler, tray, window state
│   │   ├── tray.rs           #   System tray + close-to-tray
│   │   ├── watcher.rs        #   Watch-folder daemon (notify-rs)
│   │   ├── commands/
│   │   │   ├── mod.rs        #   Re-exports + consume_pending_file
│   │   │   ├── convert.rs    #   Conversion, batch, concat, audio extract, compress
│   │   │   ├── forge.rs      #   Timeline export, pre-render, project I/O
│   │   │   ├── info.rs       #   Media info via ffprobe
│   │   │   ├── preview.rs    #   Frame extraction, image data URLs
│   │   │   ├── queue.rs      #   Queue management commands
│   │   │   ├── reziser.rs    #   Compression size estimation
│   │   │   ├── rune_tags.rs  #   Rune tag CRUD
│   │   │   ├── settings.rs   #   Settings persistence, window state, recovery
│   │   │   ├── subtitles.rs  #   Whisper transcription, embed/extract/convert
│   │   │   └── watch_folder.rs # Watch folder CRUD + queue ops
│   │   ├── ffmpeg/
│   │   │   ├── mod.rs        #   Path resolution (ffmpeg_path, ffprobe_path)
│   │   │   ├── builder.rs    #   FFmpeg argument builder (build_args)
│   │   │   ├── runner.rs     #   Process runner with progress/event streaming
│   │   │   └── probe.rs      #   ffprobe wrapper
│   │   ├── whisper/
│   │   │   ├── mod.rs        #   Binary path resolution, models dir, data_dir
│   │   │   ├── models.rs     #   9-model catalog
│   │   │   └── runner.rs     #   Whisper process runner with streaming
│   │   ├── queue/
│   │   │   ├── mod.rs        #   Queue core (register, complete, fail, cancel, trim)
│   │   │   └── pids.rs       #   Per-job PID tracking + cancellation tokens
│   │   ├── models/
│   │   │   ├── mod.rs        #   Re-exports
│   │   │   ├── conversion.rs #   ConversionParams struct
│   │   │   ├── job.rs        #   JobType, JobStatus, JobEntry
│   │   │   ├── media_info.rs #   MediaInfo, StreamInfo
│   │   │   ├── rune_tag.rs   #   RuneTag struct
│   │   │   ├── settings.rs   #   AppSettings, WindowState
│   │   │   ├── subtitle.rs   #   Subtitle-specific types
│   │   │   └── watch_folder.rs # WatchFolderConfig, QueuedFile, WatchAction
│   │   └── discord_rpc/
│   │       └── mod.rs        #   Discord Rich Presence integration
│   ├── binaries/             #   Bundled FFmpeg, FFprobe, whisper-cli
│   ├── icons/                #   App icons (various sizes)
│   ├── windows/              #   Windows NSIS installer customization
│   ├── tauri.conf.json       #   Tauri configuration
│   └── Cargo.toml            #   Rust dependencies
│
├── build-binaries.ps1        # Download FFmpeg/whisper binaries
├── build-and-deploy.ps1      # Full build + sign + package (Windows)
├── deploy.sh                 # Cross-platform deploy script
├── update.json               # Tauri updater manifest
├── package.json              # Frontend dependencies
├── vite.config.ts            # Vite configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 4. Frontend Architecture

### 4.1 Entry & Shell

- **`main.tsx`** — React root, renders `<App />`
- **`App.tsx`** — Root shell: custom titlebar, navigation, page routing, context menu provider, update banner, queue dropdown, taskbar integration, `.galdr` file opening

### 4.2 Page Routing

Pages are switched via a `useState<Page>` in `App.tsx` — no router library. The `Page` type:

```typescript
type Page = "home" | "convert" | "compress" | "settings" | "runes" | "forge" | "watch" | "subtitles";
```

Page transitions are animated via `PageTransition` (Framer Motion) with 5 selectable styles defined in `transitions.tsx`.

### 4.3 Component Conventions

- All components are function components with named exports
- Props are typed via `interface Props`
- Styling is pure CSS (no Tailwind, no CSS-in-JS) — see `STYLE_GUIDE.md`
- Custom UI primitives: `CustomSelect`, `Dropdown`, `QualitySlider`
- Animation: `ScrambleText` for rune-scramble reveal effect

### 4.4 Type System

All TypeScript interfaces live in `src/types/index.ts`. Key types:

| Type | Description |
|------|-------------|
| `ConversionParams` | All conversion parameters (input, output, codecs, filters) |
| `PresetParams` | `ConversionParams` minus `input_path` and `output_dir` |
| `RuneTag` | Saved preset (id, name, rune, description, params) |
| `MediaInfo` | ffprobe output (container, streams, duration, bitrate, size) |
| `ForgeClip` / `ForgeTrack` / `ForgeProjectData` | Forge editor data model |
| `GaldrProjectFile` | Universal `.galdr` project file format |
| `WatchFolderConfig` / `QueuedFile` | Watch folder configuration |
| `Cue` / `SubtitleStyle` / `TranscribeParams` | Subtitle/whisper types |
| `QueueJob` / `JobType` / `JobStatus` | Background queue types |

---

## 5. Backend Architecture

### 5.1 Entry & Setup

- **`main.rs`** — Calls `galdr_lib::run()`
- **`lib.rs`** — All Tauri setup: plugin registration, invoke_handler, tray, window state, close-to-tray, `.galdr` file handling

### 5.2 Module Layout

| Module | File(s) | Responsibility |
|--------|---------|----------------|
| `commands/` | `convert.rs`, `forge.rs`, `info.rs`, `preview.rs`, `queue.rs`, `reziser.rs`, `rune_tags.rs`, `settings.rs`, `subtitles.rs`, `watch_folder.rs` | Tauri command handlers (IPC) |
| `ffmpeg/` | `mod.rs`, `builder.rs`, `runner.rs`, `probe.rs` | FFmpeg process management |
| `whisper/` | `mod.rs`, `models.rs`, `runner.rs` | Whisper.cpp integration |
| `queue/` | `mod.rs`, `pids.rs` | Background job queue engine |
| `models/` | `conversion.rs`, `job.rs`, `media_info.rs`, `rune_tag.rs`, `settings.rs`, `subtitle.rs`, `watch_folder.rs` | Serde data models |
| `discord_rpc/` | `mod.rs` | Discord Rich Presence |
| `tray.rs` | — | System tray |
| `watcher.rs` | — | Filesystem watcher daemon |

### 5.3 FFmpeg Integration

**Path resolution** (`ffmpeg/mod.rs`):
- `init_paths()` — called once at startup, resolves `resource_dir/binaries/ffmpeg.exe`
- `ffmpeg_path()` / `ffprobe_path()` — lazy re-probing with fallback to PATH

**Command building** (`ffmpeg/builder.rs`):
- `build_args(&ConversionParams) -> Vec<String>` — constructs FFmpeg CLI args
- Handles: trim, codecs, bitrate, CRF, resolution, filters (crop, scale, rotate, flip, speed), subtitle burn-in, audio normalization, fade

**Process running** (`ffmpeg/runner.rs`):
- `run_conversion()` — spawns ffmpeg, parses stderr for progress, emits `FfmpegEvent`s
- Registers PID with `queue::pids` for scoped cancellation
- Progress parsing via regex on `time=HH:MM:SS.ms`

### 5.4 Whisper Integration

**Path resolution** (`whisper/mod.rs`):
- Multi-candidate probing: resource dir → exe-relative → CWD-relative → PATH
- Models stored in `%APPDATA%/galdr/models/` (survives updates)

**Model catalog** (`whisper/models.rs`):
- 9 models: tiny, base, small, medium, large-v3 (multilingual + English-only variants)
- Sizes from 75 MB to 3 GB

**Process running** (`whisper/runner.rs`):
- `run_whisper_streaming()` — spawns whisper-cli, parses stderr for progress
- Supports language detection, translation to English

---

## 6. State Management

### 6.1 Zustand Stores

All stores use Zustand's `create()` pattern. Located in `src/store/`:

| Store | File | Key State |
|-------|------|-----------|
| Main | `index.ts` | `mediaInfo`, `conversionParams`, `isConverting`, `conversionProgress`, `runeTags`, `settings`, `updateState`, `taskbarState` |
| Forge | `forgeStore.ts` | `project`, `timeline`, `clips`, `playhead`, `undo/redo stack`, `mediaLibrary` |
| Queue | `queueStore.ts` | `jobs[]`, event binding, overall progress selector |
| Watch | `watchStore.ts` | `folders[]`, `queuedFiles[]`, `activity[]` |
| Subtitle | `subtitleStore.ts` | `cues[]`, `currentFile`, `videoPath`, `recovery` |

### 6.2 Store Conventions

- All state mutations go through setter functions (no direct state mutation)
- Async operations use `invoke()` from `@tauri-apps/api/core`
- Event listeners are bound in `useEffect` hooks
- Store files export a `useXStore` hook

---

## 7. IPC / Tauri Commands

### 7.1 Command Registration

All commands are registered in `lib.rs` via `tauri::generate_handler![...]`. The full list (58 commands):

**Conversion:** `start_conversion`, `cancel_conversion`, `start_batch_conversion`, `concat_videos`, `extract_audio`, `scan_directory`, `is_directory`

**Info:** `get_media_info`, `detect_ffmpeg`, `get_default_output_dir`

**Compression:** `estimate_compress_size`

**Forge:** `export_timeline`, `cancel_forge_export`, `pre_render_timeline`, `save_project_file`, `load_project_file`, `read_file_bytes`, `delete_temp_file`

**Subtitles/Whisper:** `transcribe_audio`, `cancel_transcription`, `detect_spoken_language`, `list_whisper_models`, `is_whisper_available`, `install_whisper_model`, `delete_whisper_model`, `whisper_status`, `embed_subtitle`, `extract_subtitle`, `convert_subtitle_format`, `preview_subtitle_burn`, `read_subtitle_file`, `save_subtitle_file`

**Recovery:** `save_forge_recovery`, `load_forge_recovery`, `clear_forge_recovery`, `recovery_save_subtitle_editor`, `recovery_load_subtitle_editor`, `recovery_clear_subtitle_editor`

**Rune Tags:** `list_rune_tags`, `save_rune_tag`, `delete_rune_tag`, `apply_rune_tag`

**Watch Folders:** `watch_folders`, `save_watch_folder`, `delete_watch_folder`, `set_watching_paused`, `watching_paused`, `queued_files`, `dequeue_file`, `clear_queue`, `convert_queued_file`

**Queue:** `get_queue`, `cancel_job`, `clear_completed_jobs`

**Settings:** `load_settings`, `save_settings`, `save_app_preferences`, `load_window_state`, `save_window_state`

**Discord:** `update_discord_presence`, `update_forge_presence`, `set_discord_enabled`

**Other:** `consume_pending_file`, `extract_frames`, `read_image_data_url`

### 7.2 Command Pattern

Every command follows this pattern:

```rust
#[tauri::command]
pub fn command_name(param: Type) -> Result<ReturnType, String> {
    // 1. Validate input
    // 2. Perform work (often via spawn_blocking for long operations)
    // 3. Return Ok(result) or Err(message)
}
```

Commands that run FFmpeg/whisper use `tauri::async_runtime::spawn_blocking` to avoid blocking the IPC thread.

### 7.3 Important: `remove_job` is NOT registered

The `remove_job` command is defined in `queue/commands.rs` but is **not** in the `generate_handler!` macro. This is a known bug — the frontend per-row dismiss button silently fails.

---

## 8. Event System

### 8.1 Frontend → Backend (Tauri Commands)

See [7.1 Command Registration](#71-command-registration) above.

### 8.2 Backend → Frontend (Tauri Events)

Events are emitted via `app.emit("event-name", payload)` and listened to via `listen("event-name")`.

| Event | Payload | Source |
|-------|---------|--------|
| `conversion-progress` | `{ jobId, progress }` | `convert.rs` |
| `conversion-log` | `{ jobId, line }` | `convert.rs` |
| `batch-progress` | `{ total, done, failed, currentFile, fileProgress }` | `convert.rs` |
| `batch-log` | `{ line }` | `convert.rs` |
| `forge-export-progress` | `{ jobId, progress }` | `forge.rs` |
| `forge-render-progress` | `{ jobId, progress }` | `forge.rs` |
| `transcription-progress` | `{ jobId, progress }` | `subtitles.rs` |
| `transcription-log` | `{ jobId, line }` | `subtitles.rs` |
| `model-download-progress` | `{ modelId, progress, downloadedBytes, totalBytes }` | `subtitles.rs` |
| `queue-update` | `{ jobs: QueueJob[] }` | `queue/mod.rs` |
| `watch://file-queued` | `QueuedFile` | `watcher.rs` |
| `watch://convert-started` | `{ folderId, path, jobId }` | `watcher.rs` |
| `watch://convert-done` | `{ folderId, path, outputPath }` | `watcher.rs` |
| `watch://convert-error` | `{ folderId, path, error }` | `watcher.rs` |
| `galdr://open-file` | `string` (path) | `lib.rs` (single-instance) |

---

## 9. Background Queue

### 9.1 Architecture

The queue is a global `Lazy<Mutex<Vec<JobEntry>>>` in `queue/mod.rs`. All operations (register, update, complete, fail, cancel) lock the queue, mutate, emit a `queue-update` event, and return.

### 9.2 Job Lifecycle

```
register() → Running → complete() → Completed
                          → fail() → Failed
                          → cancel_job() → Cancelled
```

### 9.3 Scoped Cancellation (`queue/pids.rs`)

Two maps keyed by job ID:

- **`PIDS`** — `HashMap<String, u32>` — OS pid of child process. `kill_job()` targets a specific pid via `taskkill /PID <pid> /F /T` (Windows) or `kill -9 <pid>` (Unix).
- **`TOKENS`** — `HashMap<String, Arc<AtomicBool>>` — per-job cancellation flag. Polled by long-running loops (batch, whisper download).

**This replaces the legacy global `AtomicBool` flags** (`convert::CANCELLED`, `subtitles::CANCELLED_TRANSCRIPTION`) which would cancel ALL in-flight operations.

### 9.4 Job Trimming

The queue keeps at most 50 completed/failed/cancelled jobs (configurable via `MAX_COMPLETED`). Running and queued jobs are always retained.

---

## 10. Data Persistence

### 10.1 Storage Locations

| Data | Location | Format |
|------|----------|--------|
| Settings | `%APPDATA%/galdr/settings.json` | JSON |
| Rune Tags | `%APPDATA%/galdr/runes/*.json` | JSON (one file per rune) |
| Whisper Models | `%APPDATA%/galdr/models/*.ggml` | Binary |
| Window State | `%APPDATA%/galdr/window-state.json` | JSON |
| Forge Recovery | `%APPDATA%/galdr/forge-recovery.json` | JSON |
| Subtitle Recovery | `%APPDATA%/galdr/subtitle-recovery.json` | JSON |

### 10.2 Settings Structure (`AppSettings`)

```rust
struct AppSettings {
    output_dir: String,
    transition_style: String,       // "none" | "rune-dissolve" | "terminal-scroll" | "runic-portal" | "ink-ripple" | "angular-carve"
    crt_enabled: bool,
    show_rune_in_titlebar: bool,
    discord_enabled: bool,
    watch_folders: Vec<WatchFolderConfig>,
    notify_on_watch_complete: bool,
}
```

### 10.3 Auto-Save / Recovery

- **Settings:** Debounced 300ms on change
- **Forge project:** Debounced 2000ms (crash recovery)
- **Subtitle editor:** Debounced (crash recovery)
- **Window state:** Saved on close, restored on launch with monitor sanitization

---

## 11. Key Patterns & Conventions

### 11.1 Naming

- **Files:** PascalCase for components (`ConvertPage.tsx`), camelCase for utilities (`ffmpegBuilder.ts`), snake_case for Rust modules (`convert.rs`)
- **Functions:** camelCase (`build_args`, `start_conversion`)
- **Types:** PascalCase (`ConversionParams`, `JobStatus`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_COMPLETED`, `SETTLE_MS`)
- **CSS classes:** kebab-case (`home-card`, `page-transition-wrap`)

### 11.2 Error Handling

- **Rust:** Commands return `Result<T, String>` — the String is displayed in the UI
- **Frontend:** `try/catch` around `invoke()` calls; errors surfaced via `useGaldrStore.getState().setError()`
- **FFmpeg errors:** Parsed from stderr, surfaced in `LogPanel`

### 11.3 Process Management

- All FFmpeg/whisper processes are spawned with `Stdio::piped()` for stderr
- Progress is parsed from stderr via regex
- PIDs are registered with `queue::pids` immediately after spawn
- PIDs are unregistered when the process exits

### 11.4 Styling

- Pure CSS, no framework — see `docs/STYLE_GUIDE.md`
- Monochrome palette: black background, white text, gray accents
- Monospace font throughout
- No rounded corners, no shadows, no gradients
- CRT scanline overlay (toggleable)
- Rune decorations via `ScrambleText` component

### 11.5 `.galdr` File Format

Universal project file format with a `type` discriminator:

```typescript
interface GaldrProjectFile {
    version: string;
    type: "galdr-project" | "galdr-runes";
    app: string;          // "forge" for forge projects
    name: string;
    created: string;
    updated: string;
    data: ForgeProjectData | RuneTag[];
    extensions: Record<string, unknown>;
}
```

---

## 12. Known Issues & Tech Debt

### 12.1 Critical Bugs

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | `cancel_forge_export` uses `taskkill /IM ffmpeg.exe /F` (global kill) | `commands/forge.rs:475` | Kills ALL ffmpeg processes on the machine |
| 2 | `cancel_conversion` uses global kill via `kill_ffmpeg()` | `commands/convert.rs:857-880` | Same — cancels all conversions |
| 3 | `cancel_transcription` uses global kill via `kill_whisper()` | `commands/subtitles.rs:614-618` | Kills all whisper processes |
| 4 | `remove_job` command not registered in invoke_handler | `commands/queue.rs:76` / `lib.rs:98-164` | Frontend dismiss button silently fails |
| 5 | Version mismatch: source says 0.2.5, binary says 0.3.2 | `package.json`, `Cargo.toml` | Updater confusion |

### 12.2 Tech Debt

| # | Issue | Location |
|---|-------|----------|
| 6 | Legacy global `AtomicBool` cancel flags still exist | `convert.rs:9`, `subtitles.rs:15` |
| 7 | `data_dir()` duplicated identically in 3 modules | `settings.rs`, `rune_tags.rs`, `whisper/mod.rs` |
| 8 | Regex recompiled on every call in hot paths | `builder.rs`, `runner.rs`, `subtitles.rs` |
| 9 | `unwrap()` on mutex locks (12 instances) | `watcher.rs` |
| 10 | No logging framework — uses `eprintln!` | Throughout backend |
| 11 | `Cargo.toml` has placeholder metadata | `description`, `authors` |
| 12 | Dead code payloads marked `#[allow(dead_code)]` | `convert.rs:13,30` |
| 13 | No test coverage for queue, PID, settings, subtitle parsing | Entire backend |

### 12.3 Missing Features (Opportunities)

- No i18n (English-only UI)
- No onboarding/first-run tour
- Limited keyboard shortcuts (only Forge has them)
- No command palette
- No undo for destructive actions
- No hardware acceleration UI
- No compression side-by-side preview wiring
- No CI pipeline (release.yml was deleted)

---

## 13. Build & Deploy

### 13.1 Development

```bash
bun install
bun tauri dev
```

Starts Vite dev server on port 1420 + Tauri window.

### 13.2 Production Build

```powershell
# Windows
.\build-binaries.ps1      # Download FFmpeg/whisper binaries
.\build-and-deploy.ps1    # Build + sign + package
```

```bash
# Cross-platform
./deploy.sh [new_version]
```

### 13.3 Build Pipeline

1. **Version bump** — `package.json`, `tauri.conf.json`, `Cargo.toml`
2. **Binary download** — FFmpeg + whisper-cli static builds → `src-tauri/binaries/`
3. **NSIS skin prep** — `python src-tauri/windows/nsniuniuskin/prepare-nsis.py`
4. **Frontend build** — `bun run build` (tsc + vite build)
5. **Tauri build** — `bun tauri build`
6. **Sign** — `bun tauri signer sign --private-key-path src-tauri/updater.key <archive>`
7. **Package** — `.exe.zip` (Windows), `.dmg` (macOS), `.AppImage`/`.deb` (Linux)
8. **Update manifest** — `update.json` with multi-platform merge

### 13.4 Updater

- Tauri plugin checks `https://github.com/ellipog/galdr/releases/latest/download/update.json`
- Signature-verified with embedded public key
- Windows uses passive install mode

---

*ᛗᛁᛚᛚᛁᚾ ᚨᛚᛚᛏ ᛖᚱ ᛏᚨᚲᚾᚨᛞᛟᛉ ᛏᛁᛚ ᛒᛖᛋᛏᚨᛞᚨᚱ*

*(Every pixel is accounted for.)*
