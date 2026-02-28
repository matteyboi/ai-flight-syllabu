import type { LessonEntry, Maneuver } from "../models/lesson";
import { collectManeuvers, formatRecommendation } from "../utils/appHelpers";

type LessonWithOptionalFields = LessonEntry & {
  score?: number;
  maneuver?: Maneuver;
  maneuvers?: Maneuver[];
};

export type TodaysTrainingPlan = {
  item: Maneuver | string;
  reason: string;
  confidence: number; // 0-100
  source: "recommended" | "weak-area" | "rotation";
};

export type BuildTodaysTrainingPlanInput = {
  lessons: LessonEntry[];
  recommended: Maneuver | string | null | undefined;
};

function byNewestDate(a: LessonEntry, b: LessonEntry): number {
  return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime();
}

export function buildTodaysTrainingPlan(
  input: BuildTodaysTrainingPlanInput
): TodaysTrainingPlan {
  const sorted = [...input.lessons].sort(byNewestDate);

  // 1) Explicit recommendation wins
  if (input.recommended) {
    return {
      item: formatRecommendation(input.recommended),
      reason: "Primary recommendation from your current progress data.",
      confidence: 90,
      source: "recommended",
    };
  }

  // 2) Weak-area fallback (low recent score on a maneuver-tagged lesson)
  const weak = sorted.find((l) => {
    const score = (l as LessonWithOptionalFields).score;
    const man = (l as LessonWithOptionalFields).maneuver;
    return typeof score === "number" && score <= 2 && !!man;
  }) as LessonWithOptionalFields | undefined;

  if (weak?.maneuver) {
    return {
      item: weak.maneuver,
      reason: "Recent performance suggests extra practice here.",
      confidence: 78,
      source: "weak-area",
    };
  }

  // 3) Rotation fallback from historical maneuvers
  const seen = collectManeuvers(sorted, null);
  if (seen.length > 0) {
    return {
      item: seen[0],
      reason: "Keeping skills current with rotation-based practice.",
      confidence: 65,
      source: "rotation",
    };
  }

  // 4) Empty-state default
  return {
    item: "Preflight & Fundamentals",
    reason: "No prior lesson data yet. Start with baseline proficiency.",
    confidence: 50,
    source: "rotation",
  };
}