# Plan: Make ffmpeg log more detailed

## Goal
Currently the frontend log panel only shows progress percentages and error strings. The user wants to see ffmpeg's actual stderr output — codec info, stream mapping, frame/bitrate/speed stats, warnings, etc. — directly in the log panel.

## Changes

### 1. `src-tauri/src/ffmpeg/runner.rs` — Forward all stderr lines as events

- Add a new variant `FfmpegEvent::Log(String)` to the enum (line 7-11).
- In the stderr reader thread (lines 31-56), send every non-empty line as `FfmpegEvent::Log(line)` in addition to the existing `Error` and `Progress` logic.
- This makes all ffmpeg stderr output (stream mapping, codec info, frame stats, speed, etc.) available to the caller.

### 2. `src-tauri/src/commands/convert.rs` — Emit log events to frontend

- Add a new `ConversionLogPayload` struct (with `job_id: String` and `message: String`), serializable.
- In `start_conversion` (line 50-71), match on `FfmpegEvent::Log(msg)` and emit `"conversion-log"` with `ConversionLogPayload`.
- In `start_batch_conversion` (lines 228-248), match on `FfmpegEvent::Log(msg)` and emit `"batch-log"` with a log payload.

### 3. `src/pages/ConvertPage.tsx` — Listen for log events

- Add a `useEffect` that listens to `"conversion-log"` events.
- On each event, append `e.payload.message` to the `log` state array (skip empty lines).

### 4. `src/pages/CompressPage.tsx` — Same as ConvertPage

- Add listener for `"conversion-log"` events, same pattern.

### 5. `src/pages/BatchConvertPage.tsx` — Listen for batch log events

- Add listener for `"batch-log"` events and append to log.

## Files to modify

| File | Change |
|------|--------|
| `src-tauri/src/ffmpeg/runner.rs` | Add `Log(String)` variant, send all stderr lines |
| `src-tauri/src/commands/convert.rs` | Add log payload struct, emit log events to frontend |
| `src/pages/ConvertPage.tsx` | Listen for `conversion-log` event, append to log |
| `src/pages/CompressPage.tsx` | Listen for `conversion-log` event, append to log |
| `src/pages/BatchConvertPage.tsx` | Listen for `batch-log` event, append to log |
