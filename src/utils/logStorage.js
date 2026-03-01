const LOGS_STORAGE_KEY = "flightLessonLogs";

export function loadLogs() {
  if (!storage) return [];
  const raw = storage.getItem(LOGS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLogs(logs) {
  if (!storage) return;
  storage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
}