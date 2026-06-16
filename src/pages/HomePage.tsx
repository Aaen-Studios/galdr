import ScrambleText from "../components/ScrambleText";

interface Props {
  onNavigate: (page: "convert" | "batch" | "settings") => void;
}

interface UpdateEntry {
  version: string;
  date: string;
  items: string[];
}

const UPDATES: UpdateEntry[] = [
  {
    version: "v0.2.0",
    date: "2026-06-16",
    items: [
      "batch convert mode",
      "per-type output folders",
      "new homepage layout",
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-06-01",
    items: [
      "initial release",
      "single file conversion",
      "ffmpeg integration",
    ],
  },
];

interface ToolCard {
  rune: string;
  label: string;
  desc: string;
  target: "convert" | "batch" | "settings";
}

const TOOLS: ToolCard[] = [
  { rune: "ᚨ", label: "convert", desc: "single file conversion", target: "convert" },
  { rune: "ᚷ", label: "batch", desc: "bulk folder conversion", target: "batch" },
  { rune: "ᚲ", label: "settings", desc: "configure output paths", target: "settings" },
];

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="page home-layout">
      <div className="home-tools">
        {TOOLS.map((t) => (
          <div key={t.target} className="home-card" onClick={() => onNavigate(t.target)}>
            <ScrambleText as="span" className="home-card-rune" text={t.rune} hover ticks={4} />
            <div className="home-card-body">
              <ScrambleText as="span" className="home-card-label" text={t.label} hover ticks={4} />
              <span className="home-card-desc">{t.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <aside className="home-updates">
        <div className="home-updates-head">ᛉ updates</div>
        {UPDATES.map((u) => (
          <div key={u.version} className="home-update">
            <div className="home-update-hdr">
              <span className="home-update-ver">{u.version}</span>
              <span className="home-update-date">{u.date}</span>
            </div>
            <ul className="home-update-list">
              {u.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    </div>
  );
}
