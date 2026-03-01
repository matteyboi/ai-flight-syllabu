import { useMemo } from "react";
import type { LessonEntry } from "../models/lesson";

type Props = {
  unlockedStage: number; // 1..7
  lessons: LessonEntry[];

  // gates / student status
  medical: boolean;
  tsaA14: boolean;
  totalHours: number;

  // tuning knobs
  minSoloHours: number; // e.g. 10
  foundationWindow: number; // e.g. 5 (last 5)
};

const STAGE_TITLES: Record<number, string> = {
  1: "Aircraft Control",
  2: "Pattern Mastery",
  3: "Solo",
  4: "Maneuver Development",
  5: "Performance Ops",
  6: "Cross Country",
  7: "Checkride Prep",
};

// These should match your src/data/maneuvers.ts IDs
const FOUNDATION_IDS = new Set<string>([
  // Stage 1
  "preflight",
  "taxi",
  "straight-level",
  "climbs-descents",
  "turns",
  "slow-flight",
  "stalls",
  "emergencies",

  // Stage 2 (still foundational before “advanced” stuff)
  "pattern-ops",
  "normal-takeoff",
  "normal-landing",
  "go-around",
]);

const SAFETY_CRITICAL_IDS = new Set<string>([
  "preflight",
  "taxi",
  "slow-flight",
  "stalls",
  "emergencies",
  "pattern-ops",
  "normal-takeoff",
  "normal-landing",
  "go-around",
]);

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function pct(n01: number) {
  return Math.round(clamp01(n01) * 100);
}

function collectScoresNewestFirst(
  lessons: LessonEntry[],
  ids: Set<string>,
): number[] {
  // lessons are assumed newest-first OR any order; we’ll sort by dateISO
  const sorted = lessons
    .slice()
    .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  const out: number[] = [];
  for (const l of sorted) {
    for (const ms of l.maneuverScores) {
      if (ids.has(ms.maneuverId)) out.push(ms.score);
    }
  }
  return out; // newest first
}

function avgLastN(scoresNewestFirst: number[], n: number): number | null {
  const slice = scoresNewestFirst.slice(0, Math.max(0, n));
  if (slice.length === 0) return null;
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}

export function ReadinessPanel({
  unlockedStage,
  lessons,
  medical,
  tsaA14,
  totalHours,
  minSoloHours,
  foundationWindow,
}: Props) {
  const nextStage = Math.min(unlockedStage + 1, 7);

  const data = useMemo(() => {
    if (unlockedStage >= 7) {
      return {
        readiness01: 1,
        foundationAvg: null as number | null,
        safetyAvg: null as number | null,
        hours01: 1,
        admin01: 1,
      };
    }

    const foundationScores = collectScoresNewestFirst(lessons, FOUNDATION_IDS);
    const safetyScores = collectScoresNewestFirst(lessons, SAFETY_CRITICAL_IDS);

    const foundationAvg = avgLastN(foundationScores, foundationWindow);
    const safetyAvg = avgLastN(safetyScores, foundationWindow);

    // Normalize to 0..1 where 5 = 1.0
    const foundation01 = clamp01((foundationAvg ?? 0) / 5);
    const safety01 = clamp01((safetyAvg ?? 0) / 5);

    // Solo-hours progress (still useful even after solo — simple “experience” weight)
    const hours01 = minSoloHours > 0 ? clamp01(totalHours / minSoloHours) : 0;

    // Admin progress (simple, for now)
    const admin01 = clamp01((Number(medical) + Number(tsaA14)) / 2);

    // Weighted readiness (tune later)
    const readiness01 =
      0.4 * foundation01 + 0.3 * safety01 + 0.2 * hours01 + 0.1 * admin01;

    return { readiness01, foundationAvg, safetyAvg, hours01, admin01 };
  }, [
    unlockedStage,
    lessons,
    medical,
    tsaA14,
    totalHours,
    minSoloHours,
    foundationWindow,
  ]);

  const barPct = pct(data.readiness01);

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
      <h2 style={{ marginTop: 0 }}>Next Stage Readiness</h2>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
        Target: <b>Stage {nextStage}</b> — {STAGE_TITLES[nextStage]}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 1000 }}>{barPct}%</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          (weighted: foundation, safety, hours, admin)
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          height: 14,
          borderRadius: 999,
          background: "#eee",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barPct}%`,
            background: "#111",
          }}
        />
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 6, fontSize: 13 }}>
        <div>
          Foundation avg (last {foundationWindow}):{" "}
          <b>
            {data.foundationAvg === null
              ? "n/a"
              : data.foundationAvg.toFixed(2)}
          </b>
        </div>
        <div>
          Safety-critical avg (last {foundationWindow}):{" "}
          <b>{data.safetyAvg === null ? "n/a" : data.safetyAvg.toFixed(2)}</b>
        </div>
        <div>
          Hours toward “min solo hours”:{" "}
          <b>
            {totalHours.toFixed(1)} / {minSoloHours}
          </b>
        </div>
        <div>
          Admin: medical=<b>{medical ? "Yes" : "No"}</b> • TSA A.14=
          <b>{tsaA14 ? "Yes" : "No"}</b>
        </div>
      </div>
    </div>
  );
}
