# ᚷᚨᛚᛞᚱ — Agent Rules

> **Purpose:** Mandatory rules for AI agents (ZCode, Claude, Copilot, etc.) working in the galdr repository. These rules ensure consistency, prevent regressions, and keep documentation in sync with code.
>
> **Enforcement:** Every agent session MUST read `ARCHITECTURE.md` before making changes and MUST update it after any structural change.

---

## 1. Mandatory Reading Order

Before writing or modifying any code in this repository, read these files in order:

1. **`docs/ARCHITECTURE.md`** — Full system overview, module layout, patterns, known issues
2. **`docs/STYLE_GUIDE.md`** — Visual design system (colors, typography, spacing, component patterns)
3. **`docs/PLAN.md`** — Original roadmap and feature phases (for historical context)

Do not skip step 1. The architecture document contains critical information about:
- Which commands are registered vs. dead code
- The scoped cancellation system (and why global kills are forbidden)
- The event system and queue architecture
- Known bugs and tech debt

---

## 2. Documentation Update Rule

**You MUST update `docs/ARCHITECTURE.md` when you:**

- Add, remove, or rename a Tauri command → update [Section 7.1](ARCHITECTURE.md#71-command-registration) and the invoke_handler in `lib.rs`
- Add, remove, or rename a backend→frontend event → update [Section 8.2](ARCHITECTURE.md#82-backend--frontend-tauri-events)
- Create a new Zustand store or significantly change an existing one → update [Section 6.1](ARCHITECTURE.md#61-zustand-stores)
- Add a new page or component directory → update [Section 3](ARCHITECTURE.md#3-directory-structure)
- Fix a known bug → remove it from [Section 12.1](ARCHITECTURE.md#121-critical-bugs) and add a brief note about the fix
- Introduce new tech debt → add it to [Section 12.2](ARCHITECTURE.md#122-tech-debt)
- Change the build/deploy pipeline → update [Section 13](ARCHITECTURE.md#13-build--deploy)
- Add a new dependency → update [Section 2](ARCHITECTURE.md#2-tech-stack)
- Change a data model struct → update the relevant subsection in [Section 5](ARCHITECTURE.md#5-backend-architecture) or [Section 4.4](ARCHITECTURE.md#44-type-system)

**How to update:** Edit the relevant section of `ARCHITECTURE.md` to reflect the new state. Update the "Last verified" date at the top if you've made structural changes. Be precise — include file paths and line numbers where relevant.

---

## 3. Code Conventions

### 3.1 General

- **Match the surrounding code style.** Read the file you're editing and adjacent files to understand the local patterns for comment density, naming, and structure.
- **No `as any` casts in TypeScript.** Use proper type declarations. If you see existing `as any` casts, consider fixing them.
- **No `unwrap()` on mutex locks in Rust.** Use `if let Ok(guard) = lock` or `match` with graceful fallbacks. The `watcher.rs` file has 12 `.expect()` calls on locks that should be cleaned up.
- **No `eprintln!` or `println!` for logging in production code.** If you add logging, use the `tracing` crate (once added) or at minimum `log::error!`.

### 3.2 Process Management (CRITICAL)

**NEVER use global process kills.** This is the most important rule in the codebase.

- ❌ **FORBIDDEN:** `taskkill /IM ffmpeg.exe /F` — kills ALL ffmpeg processes on the machine
- ❌ **FORBIDDEN:** `pkill -9 ffmpeg` — same problem on Unix
- ❌ **FORBIDDEN:** `taskkill /IM whisper-cli.exe /F` — kills all whisper processes
- ✅ **REQUIRED:** Use `crate::queue::pids::kill_job(job_id)` — targets a specific PID
- ✅ **REQUIRED:** Use `crate::queue::pids::acquire_token(job_id)` + `is_cancelled()` for polling loops
- ✅ **REQUIRED:** Register PIDs with `crate::queue::pids::register_pid(job_id, child.id())` immediately after spawn
- ✅ **REQUIRED:** Unregister with `crate::queue::pids::unregister(job_id)` when the process exits

The legacy global kill functions (`kill_ffmpeg()`, `kill_whisper()`) still exist but must not be used in new code. They should be removed and existing callers migrated.

### 3.3 Naming

| Category | Convention | Example |
|----------|-----------|---------|
| React components | PascalCase files, named exports | `ConvertPage.tsx` → `export default function ConvertPage` |
| Utilities | camelCase files | `ffmpegBuilder.ts` |
| Rust modules | snake_case files | `convert.rs`, `queue.rs` |
| Rust functions | snake_case | `build_args`, `start_conversion` |
| Rust types | PascalCase | `ConversionParams`, `JobStatus` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_COMPLETED`, `SETTLE_MS` |
| CSS classes | kebab-case | `home-card`, `page-transition-wrap` |
| Store hooks | `useXStore` | `useGaldrStore`, `useForgeStore` |

### 3.4 Error Handling

- **Rust commands:** Return `Result<T, String>`. The `String` error is displayed to the user in the UI.
- **Frontend:** Wrap `invoke()` calls in `try/catch`. Surface errors via `useGaldrStore.getState().setError(msg)`.
- **Never silently swallow errors with `let _ = ...`** unless there's a comment explaining why. Channel send failures and emit failures should at least be logged.

### 3.5 Styling

- Pure CSS only — no Tailwind, no CSS-in-JS, no styled-components
- Follow `docs/STYLE_GUIDE.md` for colors, typography, spacing
- Monospace font throughout
- No rounded corners, no shadows, no gradients
- Rune decorations are purely decorative — use `aria-hidden="true"` on rune spans

---

## 4. Architecture Rules

### 4.1 Frontend

- **No router library.** Page routing is `useState<Page>` in `App.tsx`. If you add a page, add it to the `Page` type and the `setPage` call in `App.tsx`.
- **All TypeScript types go in `src/types/index.ts`.** Don't create separate type files unless there's a compelling reason.
- **State goes in Zustand stores.** Local component state is fine for UI-only state (hover, focus, input drafts), but anything shared across components belongs in a store.
- **Event listeners belong in `useEffect`.** Clean them up in the return function.

### 4.2 Backend

- **All Tauri commands are registered in `lib.rs`.** If you add a `#[tauri::function]`, you MUST add it to the `generate_handler!` macro or it will be dead code.
- **Long-running work uses `spawn_blocking`.** FFmpeg, whisper, and file I/O operations must not block the IPC thread.
- **Binary path resolution is lazy.** Both `ffmpeg_path()` and `whisper_path()` re-probe at call time. Don't cache the result in a way that prevents re-probing.
- **The queue is the single source of truth for job state.** Don't create separate job tracking — use `queue::register()`, `queue::complete()`, etc.

### 4.3 Data Persistence

- **Settings and user data go in `%APPDATA%/galdr/` (Windows) or `~/.config/galdr/` (Unix).** Use the `data_dir()` pattern (currently duplicated — see tech debt #7).
- **Auto-save uses debouncing.** Settings: 300ms, Forge: 2000ms. Don't write on every keystroke.
- **Recovery files are separate from project files.** Forge recovery and subtitle recovery have their own files.

---

## 5. Testing Expectations

- **Rust:** Add `#[cfg(test)]` modules for non-trivial logic. The existing tests in `ffmpeg/builder.rs` are the template.
- **Frontend:** No formal test framework yet. If you add one, document the choice in `ARCHITECTURE.md`.
- **Manual verification:** After making changes, run `bun tauri dev` and verify the affected feature works before reporting completion.

---

## 6. What NOT to Do

- ❌ Don't add a new dependency without checking if the functionality already exists in the codebase
- ❌ Don't create a new Zustand store for state that fits in an existing one
- ❌ Don't use `any` in TypeScript — fix the type instead
- ❌ Don't use `unwrap()` in Rust without a comment explaining why it's infallible
- ❌ Don't use global process kills (see [3.2](#32-process-management-critical))
- ❌ Don't add `#[allow(dead_code)]` — either use the code or remove it
- ❌ Don't bypass the queue system for background work
- ❌ Don't hardcode paths — use `data_dir()`, `ffmpeg_path()`, `whisper_path()`
- ❌ Don't add inline styles in React — use CSS classes
- ❌ Don't add new page transition styles without updating `transitions.tsx` and the `TransitionStyle` type

---

## 7. When You're Done

After completing any task that changes code:

1. **Update `docs/ARCHITECTURE.md`** if the change affects structure, patterns, or conventions (see [Section 2](#2-documentation-update-rule))
2. **Verify the build compiles** — `cargo check` for Rust, `tsc --noEmit` for TypeScript
3. **Report what you changed** — list files modified, any known issues introduced, and whether `ARCHITECTURE.md` was updated

---

*ᛗᛁᛚᛚᛁᚾ ᚨᛚᛚᛏ ᛖᚱ ᛏᚨᚲᚾᚨᛞᛟᛉ ᛏᛁᛚ ᛒᛖᛋᛏᚨᛞᚨᚱ*

*(Every pixel is accounted for.)*
