import type { AppSettings } from "../models/settings";

type SettingsPanelProps = {
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void | Promise<void>;
};

export function SettingsPanel({
  settings,
  onChange,
  onExportBackup,
  onImportBackup,
}: SettingsPanelProps) {
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

      <label style={{ display: "block", fontSize: 13, marginBottom: 10 }}>
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

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onExportBackup}>
          Export Backup
        </button>
        <label style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportBackup(file);
              e.currentTarget.value = "";
            }}
          />
          <span>Import Backup</span>
        </label>
      </div>
    </div>
  );
}