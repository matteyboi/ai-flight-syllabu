import { loadLogs } from "../utils/logStorage";

export function WeakAreasPage() {
  const logs = loadLogs();

  const counts = logs.reduce((acc, log) => {
    const key = (log.weakArea || "").trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <h1 className="page-title">Weak Areas</h1>

      <section className="section-block">
        <h2 className="section-title">From Your Logs</h2>

        {ranked.length === 0 ? (
          <p>🎯 No weak areas logged yet.</p>
        ) : (
          ranked.map(([name, count]) => (
            <p key={name}>🎯 {name} ({count})</p>
          ))
        )}
      </section>
    </>
  );
}