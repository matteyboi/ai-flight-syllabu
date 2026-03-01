import { describe, expect, it } from "vitest";
import type { LessonEntry, ManeuverScore } from "../models/lesson";
import { computeUnlockedStage } from "./stageUnlock";

function toManeuverScore(n: number): ManeuverScore {
  return n as ManeuverScore;
}

let lessonSeq = 1;
function lesson(
  scores: Array<{ maneuverId: string; score: number }>,
): LessonEntry {
  return {
    id: `lesson-${lessonSeq++}`,
    studentId: "s1",
    dateISO: new Date().toISOString(),
    status: "Dual" as LessonEntry["status"],
    notes: "",
    patternOnlyDay: false,
    maneuverScores: scores.map((s) => ({
      maneuverId: s.maneuverId,
      score: toManeuverScore(s.score),
    })),
    maneuver: undefined,
  } as LessonEntry;
}

describe("computeUnlockedStage", () => {
  it("returns stage 1 when there are no lessons", () => {
    const stage = computeUnlockedStage([], { medical: true, tsaA14: true });
    expect(stage).toBe(1);
  });

  it("returns stage 2 once any lesson exists", () => {
    const lessons = [lesson([{ maneuverId: "pattern-ops", score: 3 }])];
    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });
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

    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });
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

    const stage = computeUnlockedStage(lessons, {
      medical: false,
      tsaA14: true,
    });
    expect(stage).toBe(2);
  });

  it("uses only a rolling window of 6 scores per maneuver group", () => {
    const newestHigh = [
      lesson([
        { maneuverId: "pattern-ops", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
      lesson([
        { maneuverId: "normal-takeoff", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
      lesson([
        { maneuverId: "normal-landing", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
      lesson([
        { maneuverId: "go-around", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
      lesson([
        { maneuverId: "pattern-ops", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
      lesson([
        { maneuverId: "normal-landing", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
    ];

    const olderLow = [
      lesson([
        { maneuverId: "pattern-ops", score: 1 },
        { maneuverId: "emergencies", score: 1 },
      ]),
      lesson([
        { maneuverId: "normal-takeoff", score: 1 },
        { maneuverId: "emergencies", score: 1 },
      ]),
    ];

    const lessons = [...newestHigh, ...olderLow];
    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });

    expect(stage).toBe(4);
  });

  it("does not unlock stage 4 when tsaA14 gate is false", () => {
    const lessons = [
      lesson([
        { maneuverId: "pattern-ops", score: 5 },
        { maneuverId: "normal-takeoff", score: 5 },
        { maneuverId: "normal-landing", score: 5 },
        { maneuverId: "go-around", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
    ];

    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: false,
    });
    expect(stage).toBe(2);
  });

  it("stays stage 2 when emergency scores are missing", () => {
    const lessons = [
      lesson([
        { maneuverId: "pattern-ops", score: 5 },
        { maneuverId: "normal-takeoff", score: 5 },
        { maneuverId: "normal-landing", score: 4 },
        { maneuverId: "go-around", score: 4 },
      ]),
    ];

    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });
    expect(stage).toBe(2);
  });

  it("stays stage 2 when pattern average is below 4", () => {
    const lessons = [
      lesson([
        { maneuverId: "pattern-ops", score: 3 },
        { maneuverId: "normal-takeoff", score: 3 },
        { maneuverId: "normal-landing", score: 4 },
        { maneuverId: "go-around", score: 3 },
        { maneuverId: "emergencies", score: 5 },
      ]),
    ];

    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });
    expect(stage).toBe(2);
  });

  it("unlocks stage 4 when averages are exactly 4", () => {
    const lessons = [
      lesson([
        { maneuverId: "pattern-ops", score: 3 },
        { maneuverId: "normal-takeoff", score: 4 },
        { maneuverId: "normal-landing", score: 5 },
        { maneuverId: "go-around", score: 4 },
        { maneuverId: "emergencies", score: 4 },
      ]),
    ];

    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });
    expect(stage).toBe(4);
  });

  it("ignores unrelated maneuvers for stage-4 gating", () => {
    const lessons = [
      lesson([
        { maneuverId: "steep-turns", score: 5 },
        { maneuverId: "slow-flight", score: 5 },
      ]),
    ];

    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });
    expect(stage).toBe(2);
  });

  it("uses newest scores first in the rolling window", () => {
    const newestLow = [
      lesson([
        { maneuverId: "pattern-ops", score: 2 },
        { maneuverId: "emergencies", score: 2 },
      ]),
      lesson([
        { maneuverId: "normal-takeoff", score: 2 },
        { maneuverId: "emergencies", score: 2 },
      ]),
      lesson([
        { maneuverId: "normal-landing", score: 2 },
        { maneuverId: "emergencies", score: 2 },
      ]),
      lesson([
        { maneuverId: "go-around", score: 2 },
        { maneuverId: "emergencies", score: 2 },
      ]),
      lesson([
        { maneuverId: "pattern-ops", score: 2 },
        { maneuverId: "emergencies", score: 2 },
      ]),
      lesson([
        { maneuverId: "normal-landing", score: 2 },
        { maneuverId: "emergencies", score: 2 },
      ]),
    ];

    const olderHigh = [
      lesson([
        { maneuverId: "pattern-ops", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
      lesson([
        { maneuverId: "normal-takeoff", score: 5 },
        { maneuverId: "emergencies", score: 5 },
      ]),
    ];

    const lessons = [...newestLow, ...olderHigh];
    const stage = computeUnlockedStage(lessons, {
      medical: true,
      tsaA14: true,
    });

    expect(stage).toBe(2);
  });
});
