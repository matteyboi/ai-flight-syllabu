const LOGS_STORAGE_KEY = "flightLessonLogs";

export function loadLogs() {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLog(logEntry) {
  const current = loadLogs();
  const next = [logEntry, ...current];
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(next));
  return next;
}