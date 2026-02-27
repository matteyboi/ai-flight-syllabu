import type { LessonEntry } from "../models/lesson";

function lastNScoresFor(lessons: LessonEntry[], ids: string[], n: number) {
  const sorted = [...lessons].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );

  const scores: number[] = [];
  for (const l of sorted) {
    for (const ms of l.maneuverScores) {
      if (ids.includes(ms.maneuverId)) scores.push(ms.score);
    }
  }
  return scores.slice(0, n);
}

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Foundations that must be stable before Stage 4 maneuvers feel sane
export const STAGE4_FOUNDATION_IDS = [
  "stalls",
  "slow-flight",
  "turns",
  "climbs-descents",
];

export function stage4FoundationPassed(
  lessons: LessonEntry[],
  windowN: number
) {
  const n = Math.max(2, Math.min(8, windowN));
  const scores = lastNScoresFor(lessons, STAGE4_FOUNDATION_IDS, n);
  const a = avg(scores);

  return {
    passed: (a ?? 0) >= 4,
    avg: a,
    windowN: n,
  };
}