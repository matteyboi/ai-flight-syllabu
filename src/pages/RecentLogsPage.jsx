import { loadLogs } from "../utils/logStorage";

export function RecentLogsPage() {
  const logs = loadLogs();

  return (
    <>
      <h1 className="page-title">Recent Logs</h1>

      <section className="section-block">
        <h2 className="section-title">Saved Entries</h2>

        {logs.length === 0 ? (
          <p>🕘 No logs yet. Add one in Log Lesson.</p>
        ) : (
          <div className="recent-log-list">
            {logs.map((log) => (
              <div className="recent-log-item" key={log.id}>
                <div className="recent-log-lesson">{log.lesson || "Untitled lesson"}</div>
                <div className="recent-log-meta">
                  {log.date || "No date"} • {log.aircraft || "—"} • {log.duration || "—"}h
                </div>
                {log.notes ? <p>{log.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}