import { open } from "@tauri-apps/plugin-dialog";
import { useGaldrStore } from "../store";

const SUBFOLDERS = ["video", "audio", "image"];

export default function SettingsPage() {
  const { outputDir, setOutputDir } = useGaldrStore();

  const pickFolder = async () => {
    const sel = await open({ directory: true, multiple: false });
    if (sel) setOutputDir(sel as string);
  };

  return (
    <div className="page">
      <h2>ᚲ settings</h2>

      <div className="card">
        <label className="label">base output folder</label>
        <div className="row">
          <input className="input" value={outputDir} placeholder="not set — will prompt on convert" readOnly />
          <button className="btn" onClick={pickFolder}>browse</button>
        </div>
        {outputDir && (
          <p className="settings-hint">
            single-file conversions are organized into subfolders by media type
          </p>
        )}
      </div>

      {outputDir && (
        <div className="card">
          <label className="label">auto-created subfolders</label>
          <div className="settings-subs">
            {SUBFOLDERS.map((sf) => (
              <div key={sf} className="settings-sub">
                <span className="settings-sub-name">{sf}/</span>
                <span className="settings-sub-path">{outputDir}/{sf}/</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <label className="label">batch conversion</label>
        <p className="settings-hint">
          batch mode uses its own input and output folders independent of this setting.
          navigate to <span className="settings-link">~/galdr/convert/batch</span> to use it.
        </p>
      </div>
    </div>
  );
}
