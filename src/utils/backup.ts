import type { LessonEntry } from "../models/lesson";
import type { AppSettings } from "../models/settings";
import type { PersistedAppState } from "./storage";

export type BackupPayloadV1 = {
  version: 1;
  exportedAtISO: string;
  appState: PersistedAppState;
  lessons: LessonEntry[];
  settings: AppSettings;
};

export type BackupValidationReport = {
  invalidStudents: number;
  invalidLessons: number;
  duplicateStudentIds: number;
  duplicateLessonIds: number;
  unknownStudentRefs: number;
  hasCriticalIssues: boolean;
};

function hasStringId(v: unknown): v is { id: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { id?: unknown }).id === "string"
  );
}

function hasLessonShape(v: unknown): v is { id: string; studentId: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { id?: unknown }).id === "string" &&
    typeof (v as { studentId?: unknown }).studentId === "string"
  );
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isPersistedAppState(v: unknown): v is PersistedAppState {
  return isObject(v) && Array.isArray(v.students);
}

function isLessonEntryArray(v: unknown): v is LessonEntry[] {
  return Array.isArray(v) && v.every(hasLessonShape);
}

const BACKUP_VERSION = 1 as const;

function isIsoDateString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString() === v;
}

// Strict structural check: settings must be a JSON-safe object tree.
function isAppSettings(v: unknown): v is AppSettings {
  if (!isObject(v) || Array.isArray(v)) return false;

  const keys = Object.keys(v);
  if (keys.length !== 2) return false;
  if (!keys.includes("patternOnlyDay") || !keys.includes("recencyWindow"))
    return false;

  const patternOnlyDay = v.patternOnlyDay;
  const recencyWindow = v.recencyWindow;

  return (
    typeof patternOnlyDay === "boolean" &&
    typeof recencyWindow === "number" &&
    Number.isFinite(recencyWindow) &&
    recencyWindow >= 0
  );
}

function countDuplicates(ids: string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const id of ids) {
    if (seen.has(id)) duplicates += 1;
    else seen.add(id);
  }
  return duplicates;
}

export function createBackupJson(input: {
  appState: PersistedAppState;
  lessons: LessonEntry[];
  settings: AppSettings;
}): string {
  const payload: BackupPayloadV1 = {
    version: BACKUP_VERSION,
    exportedAtISO: new Date().toISOString(),
    appState: input.appState,
    lessons: input.lessons,
    settings: input.settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackupJson(raw: string): BackupPayloadV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (!isObject(parsed)) {
    throw new Error("Backup root must be an object.");
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error("Unsupported backup version.");
  }

  if (!isPersistedAppState(parsed.appState)) {
    throw new Error("Invalid or missing appState.");
  }

  if (!isLessonEntryArray(parsed.lessons)) {
    throw new Error("Invalid or missing lessons.");
  }

  if (!isAppSettings(parsed.settings)) {
    throw new Error("Invalid or missing settings.");
  }

  return {
    version: BACKUP_VERSION,
    exportedAtISO: isIsoDateString(parsed.exportedAtISO)
      ? parsed.exportedAtISO
      : new Date().toISOString(),
    appState: parsed.appState,
    lessons: parsed.lessons,
    settings: parsed.settings,
  };
}

export function validateBackupPayload(
  payload: BackupPayloadV1,
): BackupValidationReport {
  const studentsRaw = Array.isArray(payload.appState.students)
    ? payload.appState.students
    : [];
  const lessonsRaw = Array.isArray(payload.lessons) ? payload.lessons : [];

  const validStudents = studentsRaw.filter(hasStringId);
  const validLessons = lessonsRaw.filter(hasLessonShape);

  const invalidStudents = studentsRaw.length - validStudents.length;
  const invalidLessons = lessonsRaw.length - validLessons.length;

  const duplicateStudentIds = countDuplicates(validStudents.map((s) => s.id));
  const duplicateLessonIds = countDuplicates(validLessons.map((l) => l.id));

  const studentIdSet = new Set(validStudents.map((s) => s.id));
  const unknownStudentRefs = validLessons.reduce(
    (acc, l) => acc + (studentIdSet.has(l.studentId) ? 0 : 1),
    0,
  );

  const hasCriticalIssues =
    invalidStudents > 0 ||
    invalidLessons > 0 ||
    duplicateStudentIds > 0 ||
    duplicateLessonIds > 0 ||
    unknownStudentRefs > 0;

  return {
    invalidStudents,
    invalidLessons,
    duplicateStudentIds,
    duplicateLessonIds,
    unknownStudentRefs,
    hasCriticalIssues,
  };
}

export function parseAndValidateBackupJson(
  raw: string,
  options?: { rejectOnCritical?: boolean },
): { payload: BackupPayloadV1; report: BackupValidationReport } {
  const payload = parseBackupJson(raw);
  const report = validateBackupPayload(payload);

  const rejectOnCritical = options?.rejectOnCritical ?? true;
  if (rejectOnCritical && report.hasCriticalIssues) {
    throw new Error("Backup failed validation.");
  }

  return { payload, report };
}
