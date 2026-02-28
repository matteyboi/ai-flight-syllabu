import { useMemo, useState } from "react";
import {
  createBackupJson,
  parseAndValidateBackupJson,
  type BackupPayloadV1,
  type BackupValidationReport,
} from "../utils/backup";
import type { AppSettings } from "../models/settings";
import type { LessonEntry } from "../models/lesson";
import type { PersistedAppState } from "../utils/storage";

type Props = {
  appState: PersistedAppState;
  lessons: LessonEntry[];
  settings: AppSettings;
  onRestore: (payload: BackupPayloadV1) => void | Promise<void>;
};

export function BackupRestorePanel({ appState, lessons, settings, onRestore }: Props) {
  const [raw, setRaw] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [payload, setPayload] = useState<BackupPayloadV1 | null>(null);
  const [report, setReport] = useState<BackupValidationReport | null>(null);
  const [busy, setBusy] = useState(false);

  const canRestore = useMemo(() => !!payload && !!report && !report.hasCriticalIssues, [payload, report]);

  function runValidation(input: string) {
    setParseError(null);
    setPayload(null);
    setReport(null);

    try {
      const result = parseAndValidateBackupJson(input, { rejectOnCritical: false });
      setPayload(result.payload);
      setReport(result.report);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse backup.");
    }
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setRaw(text);
    runValidation(text);
  }

  function onExport() {
    const json = createBackupJson({ appState, lessons, settings });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-flight-backup-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onConfirmRestore() {
    if (!payload || !canRestore) return;
    setBusy(true);
    try {
      await onRestore(payload);
      alert("Backup restored.");
    } finally {
      setBusy(false);
    }
  }

  const preview = useMemo(() => {
    if (!payload) return null;

    const studentCount = Array.isArray(payload.appState?.students)
      ? payload.appState.students.length
      : 0;

    const lessonCount = Array.isArray(payload.lessons) ? payload.lessons.length : 0;

    return {
      exportedAtISO: payload.exportedAtISO,
      studentCount,
      lessonCount,
      recencyWindow: payload.settings.recencyWindow,
      patternOnlyDay: payload.settings.patternOnlyDay,
    };
  }, [payload]);

  return (
    <section>
      <h3>Backup / Restore</h3>

      <button onClick={onExport}>Export Backup</button>

      <hr />

      <label>
        Import backup file:
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <p>Or paste JSON:</p>
      <textarea
        rows={10}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste backup JSON here"
        style={{ width: "100%" }}
      />

      <div style={{ marginTop: 8 }}>
        <button onClick={() => runValidation(raw)} disabled={!raw.trim()}>
          Validate Backup
        </button>
      </div>

      {parseError && <p style={{ color: "crimson" }}>Error: {parseError}</p>}

      {report && (
        <div style={{ marginTop: 10 }}>
          <h4>Validation Report</h4>
          <ul>
            <li>Invalid students: {report.invalidStudents}</li>
            <li>Invalid lessons: {report.invalidLessons}</li>
            <li>Duplicate student IDs: {report.duplicateStudentIds}</li>
            <li>Duplicate lesson IDs: {report.duplicateLessonIds}</li>
            <li>Unknown student refs: {report.unknownStudentRefs}</li>
          </ul>
          <p>
            Critical issues: <strong>{report.hasCriticalIssues ? "Yes" : "No"}</strong>
          </p>
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 10 }}>
          <h4>Restore Preview</h4>
          <ul>
            <li>Exported at: {preview.exportedAtISO}</li>
            <li>Students: {preview.studentCount}</li>
            <li>Lessons: {preview.lessonCount}</li>
            <li>Settings.patternOnlyDay: {String(preview.patternOnlyDay)}</li>
            <li>Settings.recencyWindow: {preview.recencyWindow}</li>
          </ul>
        </div>
      )}

      <button onClick={() => void onConfirmRestore()} disabled={!canRestore || busy}>
        {busy ? "Restoring..." : "Restore Backup"}
      </button>
    </section>
  );
}