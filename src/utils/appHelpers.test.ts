import { describe, it, expect } from "vitest";
import {
  computeSnapshotMetrics,
  formatRecommendation,
  collectManeuvers,
} from "./appHelpers";
import type { LessonEntry, Maneuver } from "../models/lesson";

function mkLesson(params: {
  dateISO: string;
  score?: number;
  maneuver?: Maneuver;
  maneuvers?: Maneuver[];
}): LessonEntry {
  return params as unknown as LessonEntry;
}

const asManeuver = (value: string): Maneuver => value as unknown as Maneuver;

describe("computeSnapshotMetrics", () => {
  it("returns no-lesson defaults", () => {
    expect(computeSnapshotMetrics([])).toEqual({
      lastLessonDate: "No lessons yet",
      avgScore: null,
      trend: "No trend yet",
    });
  });

  it("returns no-scores result when lessons have no numeric scores", () => {
    const lessons = [mkLesson({ dateISO: "2026-01-01" })];
    expect(computeSnapshotMetrics(lessons)).toEqual({
      lastLessonDate: new Date("2026-01-01").toLocaleDateString(),
      avgScore: null,
      trend: "No scores yet",
    });
  });

  it("handles invalid dateISO", () => {
    const lessons = [mkLesson({ dateISO: "not-a-date", score: 80 })];
    const result = computeSnapshotMetrics(lessons);
    expect(result.lastLessonDate).toBe("Unknown");
    expect(result.avgScore).toBe(80);
  });

  it("detects improving trend", () => {
    const lessons = [
      mkLesson({ dateISO: "2026-01-06", score: 90 }),
      mkLesson({ dateISO: "2026-01-05", score: 89 }),
      mkLesson({ dateISO: "2026-01-04", score: 88 }),
      mkLesson({ dateISO: "2026-01-03", score: 70 }),
      mkLesson({ dateISO: "2026-01-02", score: 71 }),
      mkLesson({ dateISO: "2026-01-01", score: 72 }),
    ];

    expect(computeSnapshotMetrics(lessons).trend).toBe("Improving");
  });

  it("detects declining trend", () => {
    const lessons = [
      mkLesson({ dateISO: "2026-01-06", score: 70 }),
      mkLesson({ dateISO: "2026-01-05", score: 71 }),
      mkLesson({ dateISO: "2026-01-04", score: 72 }),
      mkLesson({ dateISO: "2026-01-03", score: 90 }),
      mkLesson({ dateISO: "2026-01-02", score: 89 }),
      mkLesson({ dateISO: "2026-01-01", score: 88 }),
    ];

    expect(computeSnapshotMetrics(lessons).trend).toBe("Declining");
  });

  it("detects steady trend", () => {
    const lessons = [
      mkLesson({ dateISO: "2026-01-06", score: 81 }),
      mkLesson({ dateISO: "2026-01-05", score: 80 }),
      mkLesson({ dateISO: "2026-01-04", score: 79 }),
      mkLesson({ dateISO: "2026-01-03", score: 80 }),
      mkLesson({ dateISO: "2026-01-02", score: 80 }),
      mkLesson({ dateISO: "2026-01-01", score: 80 }),
    ];

    expect(computeSnapshotMetrics(lessons).trend).toBe("Steady");
  });
});

describe("formatRecommendation", () => {
  it("formats empty values", () => {
    expect(formatRecommendation(null)).toBe("None yet");
    expect(formatRecommendation(undefined)).toBe("None yet");
  });

  it("returns string recommendations directly", () => {
    expect(formatRecommendation("Practice steep turns")).toBe("Practice steep turns");
  });

  it("uses first non-empty label field from object", () => {
    expect(formatRecommendation({ title: "Title A", code: "C1" })).toBe("Title A");
    expect(formatRecommendation({ lessonTitle: "Lesson B", code: "C2" })).toBe("Lesson B");
    expect(formatRecommendation({ label: "Label C", code: "C3" })).toBe("Label C");
    expect(formatRecommendation({ code: "C4" })).toBe("C4");
  });

  it("falls back to Available for object without usable fields", () => {
    expect(formatRecommendation({ foo: "bar" })).toBe("Available");
  });
});

describe("collectManeuvers", () => {
  it("deduplicates maneuvers and includes recommendation", () => {
    const m1 = asManeuver("Turns Around a Point");
    const m2 = asManeuver("Power-Off Stalls");
    const m3 = asManeuver("Slow Flight");

    const lessons: LessonEntry[] = [
      mkLesson({ dateISO: "2026-01-01", maneuvers: [m1, m2] }),
      mkLesson({ dateISO: "2026-01-02", maneuvers: [m2] }),
      mkLesson({ dateISO: "2026-01-03", maneuver: m3 }),
    ];

    const result = collectManeuvers(lessons, m1);
    expect(new Set(result)).toEqual(new Set([m1, m2, m3]));
  });

  it("works with null recommended maneuver", () => {
    const m1 = asManeuver("Ground Reference Maneuvers");

    const lessons: LessonEntry[] = [mkLesson({ dateISO: "2026-01-01", maneuvers: [m1] })];
    expect(collectManeuvers(lessons, null)).toEqual([m1]);
  });
});