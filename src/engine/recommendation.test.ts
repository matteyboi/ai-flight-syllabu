import { describe, expect, it, vi } from "vitest";
import type { LessonEntry, ManeuverScore } from "../models/lesson";
import { recommendNextLesson } from "./recommendation"; // <-- add this

vi.mock("../data/maneuvers", () => ({
  MANEUVERS: [
    { id: "pattern-ops", name: "Pattern Ops", stage: 1, isSafetyCritical: true },
    { id: "crosswind-landing", name: "Crosswind Landing", stage: 1, isSafetyCritical: false },
  ],
  TRAINING_ORDER: ["pattern-ops", "crosswind-landing"],
}));

function toManeuverScore(n: number): ManeuverScore {
  return n as ManeuverScore;
}

function mkLesson(
  dateISO: string,
  scores: Array<{ maneuverId: string; score: number }>
): LessonEntry {
  return {
    id: crypto.randomUUID(),
    studentId: "s1",
    dateISO,
    status: "Dual" as LessonEntry["status"],
    notes: "",
    patternOnlyDay: false,
    maneuverScores: scores.map((s) => ({
      maneuverId: s.maneuverId,
      score: toManeuverScore(s.score),
    })),
  };
}

describe("recommendNextLesson", () => {
  it("returns null when no maneuvers are available for gates", () => {
    const out = recommendNextLesson({
      lessons: [],
      unlockedStage: 0,
      patternOnlyDay: false,
      recencyWindow: 5,
    });

    expect(out.maneuver).toBeNull();
    expect(out.reason).toBe("No maneuvers available for current gates.");
  });

  it("respects pattern-only day constraint", () => {
    const out = recommendNextLesson({
      lessons: [],
      unlockedStage: 1,
      patternOnlyDay: true,
      recencyWindow: 5,
    });

    expect(out.maneuver?.id).toBe("pattern-ops");
  });

  it("prioritizes weak recent performance", () => {
    const lessonsNewestFirst = [
      mkLesson("2026-02-27T10:00:00.000Z", [
        { maneuverId: "pattern-ops", score: 2 },
        { maneuverId: "crosswind-landing", score: 5 },
      ]),
    ];

    const out = recommendNextLesson({
      lessons: lessonsNewestFirst,
      unlockedStage: 1,
      patternOnlyDay: false,
      recencyWindow: 5,
    });

    expect(out.maneuver?.id).toBe("pattern-ops");
    expect(out.reason).toContain("(<4)");
  });
});