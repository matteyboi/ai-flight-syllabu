import type { LessonEntry } from "../models/lesson";
import type { Maneuver } from "../models/lesson";
import { MANEUVERS } from "../data/maneuvers";

type Props = {
  lessons: LessonEntry[]; // newest first
  unlockedStage: number;
  windowSize: number; // last N attempts to show
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function lastNAttemptsForManeuver(
  lessons: LessonEntry[],
  maneuverId: string,
  n: number
): { score: number; dateISO: string }[] {
  const out: { score: number; dateISO: string }[] = [];
  for (const l of lessons) {
    for (const ms of l.maneuverScores) {
      if (ms.maneuverId === maneuverId) {
        out.push({ score: ms.score, dateISO: l.dateISO });
        if (out.length >= n) return out;
      }
    }
  }
  return out;
}

function scoreToHeight(score: number) {
  return 8 + score * 6; // 14..38
}

function trendDetails(scoresNewestFirst: number[]) {
  // Need enough data for a meaningful comparison
  if (scoresNewestFirst.length < 4) {
    return {
      arrow: "➖" as const,
      label: "Not enough data",
      recentAvg: null as number | null,
      olderAvg: null as number | null,
      diff: 0,
    };
  }

  const window = scoresNewestFirst.slice(0, 8); // compare up to last 8
  const half = Math.floor(window.length / 2);

  const recent = window.slice(0, half);
  const older = window.slice(half);

  const recentAvg = avg(recent) ?? 0;
  const olderAvg = avg(older) ?? 0;
  const diff = recentAvg - olderAvg;

  let arrow: "⬆" | "⬇" | "➖" = "➖";
  let label = "Stable";

  if (diff > 0.25) {
    arrow = "⬆";
    label = "Improving";
  } else if (diff < -0.25) {
    arrow = "⬇";
    label = "Declining";
  }

  return { arrow, label, recentAvg, olderAvg, diff };
}

export function ManeuverTrendPanel({ lessons, unlockedStage, windowSize }: Props) {
  const maneuvers: Maneuver[] = MANEUVERS.filter((m) => m.stage <= unlockedStage);

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,249,252,0.98) 100%)",
        boxShadow:
          "0 12px 30px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6) inset",
        color: "#111",
      }}
    >
      {/* Animations */}
      <style>
        {`
          @keyframes barGrow {
            0% { height: 8px; transform: translateY(6px); opacity: 0.55; }
            100% { transform: translateY(0px); opacity: 1; }
          }
          @keyframes newestPulse {
            0% { box-shadow: 0 0 0 rgba(0,0,0,0); }
            50% { box-shadow: 0 0 18px rgba(0,0,0,0.20); }
            100% { box-shadow: 0 0 0 rgba(0,0,0,0); }
          }
        `}
      </style>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, letterSpacing: -0.2 }}>Maneuver Trends</h2>
        <div style={{ fontSize: 12, opacity: 0.8, alignSelf: "center" }}>
          Showing last <b>{windowSize}</b> attempts per maneuver
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {maneuvers.map((m) => {
          const attempts = lastNAttemptsForManeuver(lessons, m.id, windowSize);
          const scores = attempts.map((a) => a.score);
          const a = avg(scores);

          if (attempts.length === 0) {
            return (
              <div
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px 120px",
                  gap: 10,
                  alignItems: "center",
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(245,246,248,1) 100%)",
                }}
              >
                <div style={{ fontWeight: 950 }}>{m.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>No scores yet</div>
                <div style={{ textAlign: "right", fontWeight: 950, opacity: 0.7 }}>
                  —
                </div>
              </div>
            );
          }

          const displayAvg = a ? a.toFixed(2) : "—";
          const td = trendDetails(scores);

          const recentStr =
            td.recentAvg === null ? "—" : td.recentAvg.toFixed(1);
          const olderStr =
            td.olderAvg === null ? "—" : td.olderAvg.toFixed(1);

          return (
            <div
              key={m.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 240px 140px",
                gap: 12,
                alignItems: "center",
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <div style={{ fontWeight: 950, letterSpacing: -0.2 }}>
                  {m.name}
                  {m.isSafetyCritical ? (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 950,
                        padding: "3px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.18)",
                        background: "rgba(0,0,0,0.04)",
                        opacity: 0.95,
                      }}
                    >
                      Safety-critical
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 12, opacity: 0.78, marginTop: 2 }}>
                  Stage {m.stage} • Avg(last {attempts.length}) = <b>{displayAvg}</b>
                </div>
              </div>

              {/* Micro bars (newest on the left) */}
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  alignItems: "flex-end",
                  justifyContent: "flex-end",
                  padding: "8px 10px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background:
                    "linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(244,246,250,1) 100%)",
                  height: 58,
                  boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
                }}
                title="Most recent scores (left = newest)"
              >
                {scores.map((s, idx) => {
                  const h = scoreToHeight(clamp(s, 1, 5));
                  const isNewest = idx === 0;

                  return (
                    <div
                      key={idx}
                      style={{
                        width: 10,
                        height: h,
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.55)",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(235,238,245,1) 100%)",
                        boxShadow:
                          "0 10px 18px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.8) inset",
                        transition: "height 260ms ease, transform 260ms ease",
                        animation: `barGrow 320ms ease-out ${idx * 35}ms both${
                          isNewest ? ", newestPulse 650ms ease-out 120ms 1" : ""
                        }`,
                      }}
                      title={`Score ${s}`}
                    />
                  );
                })}
              </div>

              {/* Trend + explanation */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 1000, lineHeight: 1 }}>
                  {td.arrow}
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, marginTop: 2 }}>
                  {td.label}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>
                  recent {recentStr} vs older {olderStr}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}