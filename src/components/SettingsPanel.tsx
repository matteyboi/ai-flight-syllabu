import type { AppSettings } from "../models/settings";

type SettingsPanelProps = {
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
};

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: "#1f3a66" }}>
      <label style={{ display: "block", marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={settings.patternOnlyDay}
          onChange={(e) => onChange({ ...settings, patternOnlyDay: e.target.checked })}
        />{" "}
        Pattern-only day
      </label>

      <label style={{ display: "block", fontSize: 13 }}>
        Recency window (days)
        <input
          type="number"
          min={1}
          max={180}
          value={settings.recencyWindow}
          onChange={(e) =>
            onChange({
              ...settings,
              recencyWindow: Math.min(180, Math.max(1, Number(e.target.value) || 1)),
            })
          }
          style={{ marginLeft: 8, width: 90 }}
        />
      </label>
    </div>
  );
}