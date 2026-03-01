import type { LessonEntry } from "../models/lesson";

type Props = {
  lessons: LessonEntry[];
  foundationWindow: number;
};

const GROUPS = [
  {
    key: "pattern",
    title: "Pattern (Stage 2)",
    ids: ["pattern-ops", "normal-takeoff", "normal-landing", "go-around"],
  },
  {
    key: "emergencies",
    title: "Emergency Procedures",
    ids: ["emergencies"],
  },
  {
    key: "stalls",
    title: "Stalls",
    ids: ["stalls"],
  },
  {
    key: "slow",
    title: "Slow Flight",
    ids: ["slow-flight"],
  },
];

function lessonsNewestFirst(lessons: LessonEntry[]) {
  return [...lessons].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
  );
}

function lastNScoresForGroup(lessons: LessonEntry[], ids: string[], n: number) {
  const sorted = lessonsNewestFirst(lessons);
  const scores: number[] = [];
  for (const l of sorted) {
    for (const ms of l.maneuverScores) {
      if (ids.includes(ms.maneuverId)) scores.push(ms.score);
    }
  }
  return scores.slice(0, Math.max(0, n));
}

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

function fmt(n: number | null) {
  if (n === null) return "N/A";
  return n.toFixed(2);
}

export function FoundationGatePanel({ lessons, foundationWindow }: Props) {
  const rows = GROUPS.map((g) => {
    const scores = lastNScoresForGroup(lessons, g.ids, foundationWindow);
    const a = avg(scores);
    const ok = (a ?? 0) >= 4;
    return { ...g, avg: a, ok };
  });

  const allOk = rows.every((r) => r.ok);

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 12,
        background: "#fff",
        color: "#111",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Advanced Maneuver Gate (Stage 4)</h2>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
        Uses last <b>{foundationWindow}</b> attempts. Requirement: each
        foundation average ≥ <b>4.00</b>.
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: 10,
          border: "2px solid #111",
          background: allOk ? "#f7fff7" : "#fff7f7",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 900 }}>
          Status:{" "}
          {allOk
            ? "✅ Foundation met — Stage 4 advanced allowed"
            : "🔒 Foundation not met — Stage 4 advanced blocked"}
        </div>
        {!allOk ? (
          <div style={{ marginTop: 4, opacity: 0.85 }}>
            Keep working the weak items below until they hold ≥ 4.
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((r) => (
          <div
            key={r.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fafafa",
            }}
          >
            <div>
              <div style={{ fontWeight: 900 }}>{r.title}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Recent avg (last {foundationWindow}): <b>{fmt(r.avg)}</b>
              </div>
            </div>
            <div style={{ fontWeight: 900 }}>{r.ok ? "✅" : "🔒"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
