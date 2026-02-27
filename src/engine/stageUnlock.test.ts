import { describe, expect, it } from "vitest";
import type { LessonEntry, ManeuverScore } from "../models/lesson";
import { computeUnlockedStage } from "./stageUnlock";

function toManeuverScore(n: number): ManeuverScore {
  return n as ManeuverScore;
}

function lesson(scores: Array<{ maneuverId: string; score: number }>): LessonEntry {
  return {
    id: crypto.randomUUID(),
    studentId: "s1",
    dateISO: new Date().toISOString(),
    status: "Dual" as LessonEntry["status"],
    notes: "",
    patternOnlyDay: false,
    maneuverScores: scores.map((s) => ({
      maneuverId: s.maneuverId,
      score: toManeuverScore(s.score),
    })),
  };
}

describe("computeUnlockedStage", () => {
  it("returns stage 1 when there are no lessons", () => {
    const stage = computeUnlockedStage([], { medical: true, tsaA14: true });
    expect(stage).toBe(1);
  });

  it("returns stage 2 once any lesson exists", () => {
    const lessons = [lesson([{ maneuverId: "pattern-ops", score: 3 }])];
    const stage = computeUnlockedStage(lessons, { medical: true, tsaA14: true });
    expect(stage).toBe(2);
  });

  it("returns stage 4 when solo-eligible (pattern + emergency avg >= 4 and gates true)", () => {
    const lessons = [
      lesson([
        { maneuverId: "pattern-ops", score: 4 },
        { maneuverId: "normal-takeoff", score: 5 },
        { maneuverId: "normal-landing", score: 4 },
        { maneuverId: "go-around", score: 4 },
        { maneuverId: "emergencies", score: 4 },
      ]),
    ];

    const stage = computeUnlockedStage(lessons, { medical: true, tsaA14: true });
    expect(stage).toBe(4);
  });

  it("does not unlock stage 4 when medical gate is false", () => {
    const lessons = [
      lesson([
        { maneuverId: "pattern-ops", score: 5 },
        { maneuverId: "normal-takeoff", score: 5 },
        { maneuverId: "normal-landing", score: 5 },
        { maneuverId: "go-around", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
    ];

    const stage = computeUnlockedStage(lessons, { medical: false, tsaA14: true });
    expect(stage).toBe(2);
  });

  it("uses only a rolling window of 6 scores per maneuver group", () => {
    // Newest-first lessons: provide at least 6 high scores for BOTH groups.
    const newestHigh = [
      lesson([{ maneuverId: "pattern-ops", score: 5 }, { maneuverId: "emergencies", score: 5 }]),
      lesson([{ maneuverId: "normal-takeoff", score: 5 }, { maneuverId: "emergencies", score: 5 }]),
      lesson([{ maneuverId: "normal-landing", score: 5 }, { maneuverId: "emergencies", score: 5 }]),
      lesson([{ maneuverId: "go-around", score: 5 }, { maneuverId: "emergencies", score: 5 }]),
      lesson([{ maneuverId: "pattern-ops", score: 5 }, { maneuverId: "emergencies", score: 5 }]),
      lesson([{ maneuverId: "normal-landing", score: 5 }, { maneuverId: "emergencies", score: 5 }]),
    ];

    // Older low scores should be ignored once window=6 is filled.
    const olderLow = [
      lesson([{ maneuverId: "pattern-ops", score: 1 }, { maneuverId: "emergencies", score: 1 }]),
      lesson([{ maneuverId: "normal-takeoff", score: 1 }, { maneuverId: "emergencies", score: 1 }]),
    ];

    const lessons = [...newestHigh, ...olderLow];
    const stage = computeUnlockedStage(lessons, { medical: true, tsaA14: true });

    expect(stage).toBe(4);
  });
});