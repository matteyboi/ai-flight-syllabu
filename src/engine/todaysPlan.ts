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

function maneuverName(value: Maneuver | string | null | undefined): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "");
  }
  return "";
}

const asManeuver = (value: string): Maneuver => value as unknown as Maneuver;

const SOME_MANEUVER_LIST: Maneuver[] = [
  asManeuver("Slow Flight"),
  asManeuver("Power-Off Stalls"),
  asManeuver("Turns Around a Point"),
  asManeuver("S-Turns"),
];

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
    const recentLesson = sorted[sorted.length - 1] as LessonWithOptionalFields | undefined;
    const lastFlown =
      recentLesson?.maneuver ??
      (Array.isArray(recentLesson?.maneuvers) ? recentLesson.maneuvers[0] : undefined);

    const lastName = maneuverName(lastFlown);

    const currentIndex = KNOWN_MANEUVERS.findIndex(
      (m) => maneuverName(m) === lastName
    );

    const nextManeuver =
      currentIndex >= 0
        ? KNOWN_MANEUVERS[(currentIndex + 1) % KNOWN_MANEUVERS.length]
        : KNOWN_MANEUVERS[0];

    return {
      item: nextManeuver,
      source: "rotation",
      reason: "Continue maneuver rotation for balanced proficiency.",
      confidence: 60,
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

// Add this near top-level constants in the file
const KNOWN_MANEUVERS: Maneuver[] = [
  "Slow Flight" as unknown as Maneuver,
  "Power-Off Stalls" as unknown as Maneuver,
  "Turns Around a Point" as unknown as Maneuver,
  "S-Turns" as unknown as Maneuver,
];