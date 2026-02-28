import { describe, expect, it } from "vitest";
import type { LessonEntry, Maneuver } from "../models/lesson";
import { buildTodaysTrainingPlan } from "./todaysPlan";

function mkLesson(params: {
  dateISO: string;
  score?: number;
  maneuver?: Maneuver;
  maneuvers?: Maneuver[];
}): LessonEntry {
  return params as unknown as LessonEntry;
}

describe("buildTodaysTrainingPlan", () => {
  it("uses explicit recommendation when present", () => {
    const result = buildTodaysTrainingPlan({
      lessons: [],
      recommended: "Slow Flight",
    });

    expect(result.source).toBe("recommended");
    expect(result.item).toBe("Slow Flight");
    expect(result.confidence).toBe(90);
  });

  it("falls back to weak-area when no recommendation and recent low score exists", () => {
    const result = buildTodaysTrainingPlan({
      lessons: [
        mkLesson({
          dateISO: "2026-02-20",
          score: 2,
          maneuver: "Power-Off Stalls" as Maneuver,
        }),
      ],
      recommended: null,
    });

    expect(result.source).toBe("weak-area");
    expect(result.item).toBe("Power-Off Stalls");
  });

  it("falls back to rotation using known maneuvers", () => {
    const result = buildTodaysTrainingPlan({
      lessons: [
        mkLesson({
          dateISO: "2026-02-19",
          maneuvers: ["Turns Around a Point" as Maneuver],
        }),
      ],
      recommended: null,
    });

    expect(result.source).toBe("rotation");
    expect(result.item).toBe("Turns Around a Point");
  });

  it("returns empty-state default when no data", () => {
    const result = buildTodaysTrainingPlan({
      lessons: [],
      recommended: null,
    });

    expect(result.item).toBe("Preflight & Fundamentals");
    expect(result.source).toBe("rotation");
  });
});