import { useCallback } from "react";

interface Props {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}

export default function QualitySlider({ value, onChange, label }: Props) {
  const pct = Math.round(value * 100);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value) / 100);
    },
    [onChange],
  );

  let qualityLabel: string;
  if (pct >= 90) qualityLabel = "lossless";
  else if (pct >= 70) qualityLabel = "high";
  else if (pct >= 40) qualityLabel = "medium";
  else if (pct >= 10) qualityLabel = "low";
  else qualityLabel = "worst";

  return (
    <div className="quality-slider">
      {label && <label className="label">{label}</label>}
      <div className="quality-slider-row">
        <span className="quality-slider-label">{qualityLabel}</span>
        <input
          type="range"
          className="quality-slider-input"
          min={0}
          max={100}
          value={pct}
          onChange={handleChange}
        />
        <span className="quality-slider-value">{pct}%</span>
      </div>
    </div>
  );
}
