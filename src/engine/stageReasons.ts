import type { LessonEntry } from "../models/lesson";

export type StageReason = {
  stage: number;
  bullets: string[];
};

export type Inputs = {
  lessons: LessonEntry[];
  unlockedStage: number;

  medical: boolean;
  tsaA14: boolean;

  soloEndorsementGiven: boolean;
  firstSoloCompleted: boolean;

  foundationWindow: number;
};

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function recentScoresFor(lessons: LessonEntry[], ids: string[], n: number): number[] {
  const sorted = [...lessons].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );

  const out: number[] = [];
  for (const l of sorted) {
    for (const ms of l.maneuverScores) {
      if (ids.includes(ms.maneuverId)) {
        out.push(ms.score);
        if (out.length >= n) return out;
      }
    }
  }
  return out;
}

const PATTERN_IDS = ["pattern-ops", "normal-takeoff", "normal-landing", "go-around"];
const EMERGENCY_IDS = ["emergencies"];

const PATTERN_WINDOW = 6;
const EMERGENCY_WINDOW = 4;

function fmtAvg(a: number | null) {
  return a === null ? "n/a" : a.toFixed(2);
}

export function getStageReasons(input: Inputs): StageReason[] {
  const {
    lessons,
    unlockedStage,
    medical,
    tsaA14,
    soloEndorsementGiven,
    firstSoloCompleted,
    foundationWindow,
  } = input;

  const reasons: StageReason[] = [];

  // Stage 3 lock reasons
  if (unlockedStage < 3) {
    const patternRecent = recentScoresFor(lessons, PATTERN_IDS, PATTERN_WINDOW);
    const emergencyRecent = recentScoresFor(lessons, EMERGENCY_IDS, EMERGENCY_WINDOW);

    const patternAvg = avg(patternRecent);
    const emergencyAvg = avg(emergencyRecent);

    reasons.push({
      stage: 3,
      bullets: [
        `Pattern proficiency avg (last ${PATTERN_WINDOW}) ≥ 4 (current: ${fmtAvg(patternAvg)} from ${patternRecent.length} score(s))`,
        `Emergency procedures avg (last ${EMERGENCY_WINDOW}) ≥ 4 (current: ${fmtAvg(emergencyAvg)} from ${emergencyRecent.length} score(s))`,
        `Medical completed (current: ${medical ? "Yes" : "No"})`,
        `TSA (A.14) completed (current: ${tsaA14 ? "Yes" : "No"})`,
      ],
    });
  }

  // Stage 4 lock reasons (simple + clean)
  if (unlockedStage < 4) {
    reasons.push({
      stage: 4,
      bullets: [
        `Solo endorsement given (current: ${soloEndorsementGiven ? "Yes" : "No"})`,
        `First solo completed (current: ${firstSoloCompleted ? "Yes" : "No"})`,
      ],
    });
  }

  // Stage 5 placeholder (kept for structure)
  if (unlockedStage < 5) {
    reasons.push({
      stage: 5,
      bullets: [
        `Foundation gate (last ${foundationWindow}) — (Next) We will define exact prerequisites for this stage.`,
      ],
    });
  }

  if (unlockedStage < 6) {
    reasons.push({ stage: 6, bullets: ["(Next) Cross-country phase requirements will be defined here."] });
  }

  if (unlockedStage < 7) {
    reasons.push({ stage: 7, bullets: ["(Next) Checkride prep requirements will be defined here."] });
  }

  return reasons;
}