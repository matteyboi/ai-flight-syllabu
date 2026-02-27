import type { LessonEntry } from "../models/lesson";
import type { Maneuver } from "../models/lesson";
import { MANEUVERS, TRAINING_ORDER } from "../data/maneuvers";

type Inputs = {
  lessons: LessonEntry[]; // newest first
  unlockedStage: number;
  patternOnlyDay: boolean;

  // Rolling window used for recommendation decisions
  recencyWindow: number; // e.g. 5
};

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function recentScoresFor(
  lessons: LessonEntry[],
  maneuverId: string,
  n: number
): number[] {
  const out: number[] = [];
  for (const l of lessons) {
    for (const ms of l.maneuverScores) {
      if (ms.maneuverId === maneuverId) {
        out.push(ms.score);
        if (out.length >= n) return out;
      }
    }
  }
  return out;
}

// Stage 2 pattern-only day constraint
const PATTERN_ONLY_IDS = new Set<string>([
  "pattern-ops",
  "normal-takeoff",
  "normal-landing",
  "go-around",
]);

function isAllowedByPatternOnly(id: string, patternOnlyDay: boolean) {
  if (!patternOnlyDay) return true;
  return PATTERN_ONLY_IDS.has(id);
}

type Candidate = {
  m: Maneuver;
  recentAvg: number | null;
  recentScores: number[];
  reason: string;
  priority: number; // lower = earlier pick
};

export function recommendNextLesson(input: Inputs): {
  maneuver: Maneuver | null;
  reason: string;
} {
  const { lessons, unlockedStage, patternOnlyDay, recencyWindow } = input;

  const library = MANEUVERS.filter(
    (m) => m.stage <= unlockedStage && isAllowedByPatternOnly(m.id, patternOnlyDay)
  );

  if (library.length === 0) {
    return { maneuver: null, reason: "No maneuvers available for current gates." };
  }

  // Use TRAINING_ORDER to walk in a logical order
  const orderedIds =
    TRAINING_ORDER.length > 0
      ? TRAINING_ORDER.filter((id) => library.some((m) => m.id === id))
      : library.map((m) => m.id);

  const candidates: Candidate[] = [];

  for (const id of orderedIds) {
    const m = library.find((x) => x.id === id);
    if (!m) continue;

    const scores = recentScoresFor(lessons, m.id, recencyWindow);
    const a = avg(scores);

    // No history → early lessons should appear first; advanced should wait for order
    if (scores.length === 0) {
      const basePriority = m.isSafetyCritical ? 10 : 20;
      candidates.push({
        m,
        recentAvg: null,
        recentScores: [],
        reason: "No recent scores yet.",
        priority: basePriority,
      });
      continue;
    }

    const lastScore = scores[0];

    // Score logic (recent avg)
    // <4 → still needs repeat / focus
    // >=4 → deprioritize
    if ((a ?? 0) < 4) {
      // Safety-critical gets higher priority (lower number)
      const basePriority = m.isSafetyCritical ? 0 : 5;

      // If last score was really bad, boost priority
      const bump = lastScore <= 2 ? -1 : 0;

      candidates.push({
        m,
        recentAvg: a,
        recentScores: scores,
        reason: `Recent avg (last ${scores.length}) is ${a!.toFixed(
          2
        )} (<4). Last score ${lastScore}.`,
        priority: basePriority + bump,
      });
    } else {
      // Consider “completed enough” for now, but keep as fallback
      const basePriority = m.isSafetyCritical ? 50 : 60;
      candidates.push({
        m,
        recentAvg: a,
        recentScores: scores,
        reason: `Recent avg (last ${scores.length}) is ${a!.toFixed(
          2
        )} (≥4). Maintain ≥4 before advancing.`,
        priority: basePriority,
      });
    }
  }

  // Sort by priority, then by training order
  candidates.sort((a, b) => a.priority - b.priority);

  const pick = candidates[0];
  return { maneuver: pick?.m ?? null, reason: pick?.reason ?? "No pick." };
}