const LOGS_STORAGE_KEY = "flightLessonLogs";

export function loadLogs() {
  if (typeof globalThis === "undefined" || !globalThis.localStorage) return [];
  const raw = globalThis.localStorage.getItem(LOGS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLogs(logs) {
  if (typeof globalThis === "undefined" || !globalThis.localStorage) return;
  globalThis.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
}