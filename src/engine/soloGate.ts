import type { LessonEntry } from "../models/lesson";

export type SoloGateInputs = {
  lessons: LessonEntry[];
  medical: boolean;
  tsaA14: boolean;
  windowN: number;
};

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function lastNScoresFor(
  lessons: LessonEntry[],
  ids: string[],
  n: number
) {
  const sorted = [...lessons].sort(
    (a, b) =>
      new Date(b.dateISO).getTime() -
      new Date(a.dateISO).getTime()
  );

  const scores: number[] = [];

  for (const l of sorted) {
    for (const ms of l.maneuverScores) {
      if (ids.includes(ms.maneuverId)) {
        scores.push(ms.score);
      }
    }
  }

  return scores.slice(0, n);
}

const PATTERN_IDS = [
  "pattern-ops",
  "normal-takeoff",
  "normal-landing",
  "go-around",
];

const EMERGENCY_IDS = ["emergencies"];

export function evaluateSoloGate(inputs: SoloGateInputs) {
  const windowN = Math.max(2, Math.min(8, inputs.windowN));

  const patternAvg = avg(
    lastNScoresFor(inputs.lessons, PATTERN_IDS, windowN)
  );

  const emergencyAvg = avg(
    lastNScoresFor(inputs.lessons, EMERGENCY_IDS, windowN)
  );

  const meetsPattern = (patternAvg ?? 0) >= 4;
  const meetsEmergency = (emergencyAvg ?? 0) >= 4;
  const meetsMedical = inputs.medical;
  const meetsTsa = inputs.tsaA14;

  const eligible =
    meetsPattern &&
    meetsEmergency &&
    meetsMedical &&
    meetsTsa;

  const reasons: string[] = [];

  if (!meetsPattern)
    reasons.push(
      `Pattern avg ≥ 4 (last ${windowN}: ${
        patternAvg?.toFixed(2) ?? "N/A"
      })`
    );

  if (!meetsEmergency)
    reasons.push(
      `Emergencies avg ≥ 4 (last ${windowN}: ${
        emergencyAvg?.toFixed(2) ?? "N/A"
      })`
    );

  if (!meetsMedical)
    reasons.push("Medical must be completed");

  if (!meetsTsa)
    reasons.push("TSA (A.14) must be completed");

  return {
    eligible,
    patternAvg,
    emergencyAvg,
    windowN,
    reasons,
  };
}