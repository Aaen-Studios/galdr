import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import HomePage from "./pages/HomePage";
import ConvertPage from "./pages/ConvertPage";
import BatchConvertPage from "./pages/BatchConvertPage";
import SettingsPage from "./pages/SettingsPage";
import ScrambleText from "./components/ScrambleText";
import "./App.css";

type Page = "home" | "convert" | "batch" | "settings";

const PAGE_LABELS: Record<Page, string> = {
  home: "home",
  convert: "convert",
  batch: "batch",
  settings: "settings",
};

function App() {
  const [page, setPage] = useState<Page>("home");
  const win = getCurrentWindow();

  const rootSegs: { label: string; target: Page }[] = [
    { label: "~", target: "home" },
    { label: "galdr", target: "home" },
  ];

  const pageSegs: { label: string; target: Page }[] = (() => {
    if (page === "batch") {
      return [
        { label: "convert", target: "convert" },
        { label: "batch", target: "batch" },
      ];
    }
    return [{ label: PAGE_LABELS[page], target: page }];
  })();

  const pathSegs = [...rootSegs, ...pageSegs];

  return (
    <div className="app-shell">
      <header className="titlebar" data-tauri-drag-region>
        <div className="titlebar-left">
          <button className="titlebar-btn" onClick={() => setPage("settings")}>
            ᚲ
          </button>
        </div>
        <ScrambleText as="span" className="titlebar-logo" text="ᚷ Galdr" hover />
        <div className="titlebar-controls">
          <button className="titlebar-btn" onClick={() => win.minimize()}>
            _
          </button>
          <button className="titlebar-btn" onClick={() => win.toggleMaximize()}>
            []
          </button>
          <button className="titlebar-btn titlebar-close" onClick={() => win.close()}>
            x
          </button>
        </div>
      </header>

      <nav className="path-nav">
        {pathSegs.map((seg, i) => (
          <span key={i} className="path-group">
            {i > 0 && <span className="path-sep">/</span>}
            <span
              className={`path-seg${i === pathSegs.length - 1 ? " active" : ""}`}
              onClick={() => seg.target !== page && setPage(seg.target)}
            >
              {seg.label}
            </span>
          </span>
        ))}
        <span className="path-sep trail">/</span>
      </nav>

      <main className="main-content">
        {page === "home" && <HomePage onNavigate={setPage} />}
        {page === "convert" && <ConvertPage />}
        {page === "batch" && <BatchConvertPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;
