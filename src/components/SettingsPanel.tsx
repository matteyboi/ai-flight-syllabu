import type { AppSettings } from "../models/settings";
import type { BackupValidationReport } from "../utils/backup";

type ImportSummary = {
  fileName: string;
  studentCount: number;
  lessonCount: number;
  patternOnlyDay: boolean;
  recencyWindow: number;
};

type SettingsPanelProps = {
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void | Promise<void>;

  pendingImportSummary?: ImportSummary | null;
  importValidation?: BackupValidationReport | null;
  canConfirmImport?: boolean;
  onConfirmImport?: () => void;
  onCancelImport?: () => void;

  canUndoImport?: boolean;
  onUndoLastImport?: () => void;
};

export function SettingsPanel({
  settings,
  onChange,
  onExportBackup,
  onImportBackup,
  pendingImportSummary = null,
  importValidation = null,
  canConfirmImport = false,
  onConfirmImport,
  onCancelImport,
  canUndoImport = false,
  onUndoLastImport,
}: SettingsPanelProps) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: "#1f3a66" }}>
      <label style={{ display: "block", marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={settings.patternOnlyDay}
          onChange={(e) =>
            onChange({ ...settings, patternOnlyDay: e.target.checked })
          }
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
              recencyWindow: Math.min(
                180,
                Math.max(1, Number(e.target.value) || 1),
              ),
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

        {canUndoImport && onUndoLastImport ? (
          <button type="button" onClick={onUndoLastImport}>
            Undo Last Import
          </button>
        ) : null}
      </div>

      {pendingImportSummary ? (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 8,
            background: "#0f274a",
            border: "1px solid #3b82f6",
          }}
        >
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Ready to import: <strong>{pendingImportSummary.fileName}</strong>
          </div>

          <div style={{ fontSize: 12, marginBottom: 8 }}>
            Students: {pendingImportSummary.studentCount} · Lessons:{" "}
            {pendingImportSummary.lessonCount} · Pattern-only:{" "}
            {pendingImportSummary.patternOnlyDay ? "On" : "Off"} · Recency:{" "}
            {pendingImportSummary.recencyWindow} days
          </div>

          {importValidation ? (
            <div
              style={{
                fontSize: 12,
                marginBottom: 8,
                color: importValidation.hasCriticalIssues
                  ? "#fecaca"
                  : "#bbf7d0",
              }}
            >
              Validation — invalid students: {importValidation.invalidStudents},
              invalid lessons: {importValidation.invalidLessons}, duplicate
              student IDs: {importValidation.duplicateStudentIds}, duplicate
              lesson IDs: {importValidation.duplicateLessonIds}, unknown lesson
              refs: {importValidation.unknownStudentRefs}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => onConfirmImport?.()}
              disabled={!canConfirmImport}
            >
              Confirm Import (Overwrite)
            </button>
            <button type="button" onClick={() => onCancelImport?.()}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
