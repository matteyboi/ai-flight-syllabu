import type { LessonEntry } from "../models/lesson";
import { MANEUVERS } from "../data/maneuvers";

export type SoloEligibilityResult = {
  ready: boolean;
  summary: string;
  checks: {
    id: string;
    label: string;
    pass: boolean;
    detail: string;
  }[];
};

type Inputs = {
  lessons: LessonEntry[];
  totalHours: number;
  minSoloHours: number;
  medical: boolean;
  tsaA14: boolean;
};

const PATTERN_IDS = [
  "pattern-ops",
  "normal-takeoff",
  "normal-landing",
  "go-around",
];
const EMERGENCY_IDS = ["emergencies"];
const STALL_IDS = ["stalls"];

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

function scoresFor(lessons: LessonEntry[], ids: string[]) {
  const out: number[] = [];
  for (const l of lessons) {
    for (const ms of l.maneuverScores) {
      if (ids.includes(ms.maneuverId)) out.push(ms.score);
    }
  }
  return out;
}

function lastScoreFor(lessons: LessonEntry[], ids: string[]) {
  const sorted = [...lessons].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
  );

  for (const l of sorted) {
    // for a group (pattern/stalls/emergencies), return the FIRST matching score we find
    for (const ms of l.maneuverScores) {
      if (ids.includes(ms.maneuverId)) {
        return {
          score: ms.score,
          dateISO: l.dateISO,
          maneuverId: ms.maneuverId,
        };
      }
    }
  }
  return null;
}

function formatAvg(a: number | null) {
  return a === null ? "N/A" : a.toFixed(2);
}

function maneuverName(id: string) {
  return MANEUVERS.find((m) => m.id === id)?.name ?? id;
}

/**
 * Extra safety rule:
 * If any SAFETY-CRITICAL maneuver has a last score <= 3 in the last N lessons,
 * solo should be blocked until fixed.
 */
function recentSafetyCriticalWeakness(
  lessons: LessonEntry[],
  recentLessonCount: number,
) {
  const sorted = [...lessons].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
  );
  const recent = sorted.slice(0, recentLessonCount);

  for (const l of recent) {
    for (const ms of l.maneuverScores) {
      const m = MANEUVERS.find((x) => x.id === ms.maneuverId);
      if (m?.isSafetyCritical && ms.score <= 3) {
        return {
          maneuverId: ms.maneuverId,
          score: ms.score,
          dateISO: l.dateISO,
        };
      }
    }
  }
  return null;
}

export function evaluateSoloEligibility(input: Inputs): SoloEligibilityResult {
  const { lessons, totalHours, minSoloHours, medical, tsaA14 } = input;

  // Core averages
  const patternAvg = avg(scoresFor(lessons, PATTERN_IDS));
  const emergencyAvg = avg(scoresFor(lessons, EMERGENCY_IDS));
  const stallsAvg = avg(scoresFor(lessons, STALL_IDS));

  // Core last attempts (for “stable proficiency”)
  const patternLast = lastScoreFor(lessons, PATTERN_IDS);
  const emergencyLast = lastScoreFor(lessons, EMERGENCY_IDS);
  const stallsLast = lastScoreFor(lessons, STALL_IDS);

  // Safety critical recent weakness check
  const recentWeak = recentSafetyCriticalWeakness(lessons, 3);

  const checks: SoloEligibilityResult["checks"] = [];

  // Hours gate
  checks.push({
    id: "hours",
    label: "Minimum training time",
    pass: totalHours >= minSoloHours,
    detail: `Total hours: ${totalHours.toFixed(1)} (minimum: ${minSoloHours.toFixed(1)})`,
  });

  // Admin gates
  checks.push({
    id: "medical",
    label: "Medical completed",
    pass: medical,
    detail: medical ? "Yes" : "No",
  });

  checks.push({
    id: "tsa",
    label: "TSA (A.14) completed",
    pass: tsaA14,
    detail: tsaA14 ? "Yes" : "No",
  });

  // Performance gates (Average >= 4 AND Last >= 4)
  checks.push({
    id: "pattern",
    label: "Pattern proficiency stable (avg ≥ 4 AND last ≥ 4)",
    pass: (patternAvg ?? 0) >= 4 && (patternLast?.score ?? 0) >= 4,
    detail: `Avg: ${formatAvg(patternAvg)} • Last: ${
      patternLast
        ? `${patternLast.score} (${maneuverName(patternLast.maneuverId)})`
        : "N/A"
    }`,
  });

  checks.push({
    id: "stalls",
    label: "Stalls stable (avg ≥ 4 AND last ≥ 4)",
    pass: (stallsAvg ?? 0) >= 4 && (stallsLast?.score ?? 0) >= 4,
    detail: `Avg: ${formatAvg(stallsAvg)} • Last: ${
      stallsLast ? `${stallsLast.score}` : "N/A"
    }`,
  });

  checks.push({
    id: "emergencies",
    label: "Emergency procedures stable (avg ≥ 4 AND last ≥ 4)",
    pass: (emergencyAvg ?? 0) >= 4 && (emergencyLast?.score ?? 0) >= 4,
    detail: `Avg: ${formatAvg(emergencyAvg)} • Last: ${
      emergencyLast ? `${emergencyLast.score}` : "N/A"
    }`,
  });

  // Recent safety rule
  checks.push({
    id: "recentSafety",
    label: "No recent safety-critical weak scores (last 3 lessons)",
    pass: recentWeak === null,
    detail:
      recentWeak === null
        ? "No safety-critical scores ≤ 3 in last 3 lessons."
        : `Found: ${maneuverName(recentWeak.maneuverId)} scored ${recentWeak.score}`,
  });

  const ready = checks.every((c) => c.pass);

  const summary = ready
    ? "READY FOR SOLO (requirements satisfied)"
    : "NOT READY FOR SOLO (one or more requirements failed)";

  return { ready, summary, checks };
}
