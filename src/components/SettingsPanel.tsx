import type { SchoolSettings } from "../models/settings";

type Props = {
  settings: SchoolSettings;
  onChange: (next: SchoolSettings) => void;
};

export function SettingsPanel({ settings, onChange }: Props) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: "2px solid #111",
        borderRadius: 12,
        background: "#fff",
        color: "#111",
      }}
    >
      <h2 style={{ marginTop: 0 }}>School Settings</h2>

      <label style={{ display: "block" }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Minimum hours before Solo Ready
        </div>
        <input
          type="number"
          value={settings.minSoloHours}
          min={0}
          step={0.5}
          onChange={(e) =>
            onChange({ ...settings, minSoloHours: Number(e.target.value) })
          }
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />
      </label>

      <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
        This affects the Solo Readiness “READY FOR SOLO” verdict only. Endorsement
        is still instructor-controlled.
      </div>
    </div>
  );
}