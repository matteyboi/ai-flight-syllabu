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

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function createBackupJson(input: {
  appState: PersistedAppState;
  lessons: LessonEntry[];
  settings: AppSettings;
}): string {
  const payload: BackupPayloadV1 = {
    version: 1,
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

  if (!isObject(parsed) || parsed.version !== 1) {
    throw new Error("Unsupported backup version.");
  }

  if (!isObject(parsed.appState) || !Array.isArray(parsed.lessons) || !isObject(parsed.settings)) {
    throw new Error("Backup file is missing required fields.");
  }

  const appState = parsed.appState as PersistedAppState;
  const lessons = parsed.lessons as LessonEntry[];
  const settings = parsed.settings as AppSettings;

  if (!Array.isArray(appState.students)) {
    throw new Error("Invalid appState.students.");
  }

  return {
    version: 1,
    exportedAtISO:
      typeof parsed.exportedAtISO === "string" ? parsed.exportedAtISO : new Date().toISOString(),
    appState,
    lessons,
    settings,
  };
}