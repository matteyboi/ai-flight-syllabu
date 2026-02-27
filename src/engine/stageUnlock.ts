import type { LessonEntry } from "../models/lesson";

type GateInputs = {
  medical: boolean;
  tsaA14: boolean;
};

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

function lastNScoresFor(lessonsNewestFirst: LessonEntry[], ids: string[], n: number) {
  const out: number[] = [];

  // lessons are newest-first already in App.tsx
  for (const l of lessonsNewestFirst) {
    for (const ms of l.maneuverScores) {
      if (ids.includes(ms.maneuverId)) out.push(ms.score);
      if (out.length >= n) return out; // stop once we have enough
    }
  }

  return out;
}

// Must match src/data/maneuvers.ts
const PATTERN_IDS = ["pattern-ops", "normal-takeoff", "normal-landing", "go-around"];
const EMERGENCY_IDS = ["emergencies"];

// ✅ Rolling window size for gates
const GATE_WINDOW = 6;

export function computeUnlockedStage(lessonsNewestFirst: LessonEntry[], gates: GateInputs): number {
  let stage = 1;

  // Stage 2 once any lesson exists
  if (lessonsNewestFirst.length > 0) stage = 2;

  const patternScores = lastNScoresFor(lessonsNewestFirst, PATTERN_IDS, GATE_WINDOW);
  const emergencyScores = lastNScoresFor(lessonsNewestFirst, EMERGENCY_IDS, GATE_WINDOW);

  const patternAvg = avg(patternScores);
  const emergencyAvg = avg(emergencyScores);

  const soloEligible =
    (patternAvg ?? 0) >= 4 &&
    (emergencyAvg ?? 0) >= 4 &&
    gates.medical &&
    gates.tsaA14;

  // Stage 3+4 is handled in App.tsx (endorsement + first solo + hours),
  // but we allow the base engine to move to 4 when eligible.
  if (soloEligible) stage = 4;

  return stage;
}