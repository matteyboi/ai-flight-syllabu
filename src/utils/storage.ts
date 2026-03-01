import type { Student } from "../models/student";
import type { LessonEntry } from "../models/lesson";
import type { AppSettings } from "../models/settings";
import { DEFAULT_SETTINGS } from "../models/settings";

export type PersistedAppState = {
  students: Student[];
  selectedStudentId: string | null;
};

type Versioned<T> = {
  version: number;
  data: T;
};

const APP_KEY = "afs_app_state";
const LESSONS_KEY = "afs_lessons";
const SETTINGS_KEY = "afs_settings";

const LEGACY_APP_KEY = "afs_app_state_v4";
const LEGACY_LESSONS_KEY = "afs_lessons_v4";
const LEGACY_SETTINGS_KEY = "afs_settings_v4";

const STORAGE_VERSION = 1;

function safeParse<T>(raw: string | null): T | null {
  try {
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function migrateLesson(raw: unknown): LessonEntry | null {
  if (!isRecord(raw)) return null;

  const id = typeof raw.id === "string" ? raw.id : null;
  const studentId = typeof raw.studentId === "string" ? raw.studentId : null;
  const dateISO = typeof raw.dateISO === "string" ? raw.dateISO : null;

  if (!id || !studentId || !dateISO) return null;

  const notes = typeof raw.notes === "string" ? raw.notes : "";
  const status = (raw.status ?? "Unknown") as LessonEntry["status"];
  const patternOnlyDay =
    typeof raw.patternOnlyDay === "boolean" ? raw.patternOnlyDay : false;

  const maneuverScores = Array.isArray(raw.maneuverScores)
    ? raw.maneuverScores
        .filter(isRecord)
        .map((ms) => ({
          maneuverId: String(ms.maneuverId ?? ""),
          score: ms.score as LessonEntry["maneuverScores"][number]["score"],
        }))
        .filter((ms) => ms.maneuverId.length > 0)
    : [];

  return {
    id,
    studentId,
    dateISO,
    notes,
    status,
    patternOnlyDay,
    maneuverScores,
    maneuver: undefined,
  };
}

function migrateLessons(input: unknown): LessonEntry[] {
  if (!Array.isArray(input)) return [];
  return input.map(migrateLesson).filter((l): l is LessonEntry => l !== null);
}

function clampRecencyWindow(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.recencyWindow;
  return Math.min(180, Math.max(1, Math.round(n)));
}

function migrateSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  return {
    patternOnlyDay:
      typeof r.patternOnlyDay === "boolean"
        ? r.patternOnlyDay
        : DEFAULT_SETTINGS.patternOnlyDay,
    recencyWindow: clampRecencyWindow(r.recencyWindow),
  };
}

export function loadAppState(): PersistedAppState {
  const fallback: PersistedAppState = { students: [], selectedStudentId: null };

  const current = safeParse<Versioned<PersistedAppState>>(
    localStorage.getItem(APP_KEY),
  );
  if (current?.version === STORAGE_VERSION && current.data) {
    return current.data;
  }

  const legacy = safeParse<PersistedAppState>(
    localStorage.getItem(LEGACY_APP_KEY),
  );
  if (legacy) return legacy;

  return fallback;
}

export function saveAppState(state: PersistedAppState): void {
  const payload: Versioned<PersistedAppState> = {
    version: STORAGE_VERSION,
    data: state,
  };
  localStorage.setItem(APP_KEY, JSON.stringify(payload));
}

export function loadLessons(): LessonEntry[] {
  const current = safeParse<Versioned<LessonEntry[]>>(
    localStorage.getItem(LESSONS_KEY),
  );
  if (current?.version === STORAGE_VERSION) {
    return migrateLessons(current.data);
  }

  const legacy = safeParse<LessonEntry[]>(
    localStorage.getItem(LEGACY_LESSONS_KEY),
  );
  if (legacy) return migrateLessons(legacy);

  return [];
}

export function saveLessons(lessons: LessonEntry[]): void {
  const payload: Versioned<LessonEntry[]> = {
    version: STORAGE_VERSION,
    data: lessons,
  };
  localStorage.setItem(LESSONS_KEY, JSON.stringify(payload));
}

export function loadSettings(): AppSettings {
  const current = safeParse<Versioned<AppSettings>>(
    localStorage.getItem(SETTINGS_KEY),
  );
  if (current?.version === STORAGE_VERSION)
    return migrateSettings(current.data);

  const legacy = safeParse<AppSettings>(
    localStorage.getItem(LEGACY_SETTINGS_KEY),
  );
  if (legacy) return migrateSettings(legacy);

  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  const payload: Versioned<AppSettings> = {
    version: STORAGE_VERSION,
    data: migrateSettings(settings),
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
}
