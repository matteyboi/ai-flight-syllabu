import { describe, expect, it } from "vitest";
import {
  collectManeuvers,
  computeSnapshotMetrics,
  formatRecommendation,
} from "./appHelpers.ts";
import type { LessonEntry, Maneuver } from "../models/lesson";

function lesson(overrides: Partial<LessonEntry> = {}): LessonEntry {
  return {
    id: "l1",
    studentId: "s1",
    dateISO: new Date().toISOString(),
    ...overrides,
  } as LessonEntry;
}

describe("computeSnapshotMetrics", () => {
  it("returns empty-state metrics", () => {
    const out = computeSnapshotMetrics([]);
    expect(out.lastLessonDate).toBe("No lessons yet");
    expect(out.avgScore).toBeNull();
    expect(out.trend).toBe("No trend yet");
  });

  it("returns Unknown when dateISO is invalid", () => {
    const out = computeSnapshotMetrics([lesson({ dateISO: "not-a-date" })]);
    expect(out.lastLessonDate).toBe("Unknown");
  });

  it("returns No scores yet when no finite numeric scores exist", () => {
    const l = lesson() as LessonEntry & { score?: unknown };
    l.score = "bad";
    const out = computeSnapshotMetrics([l as LessonEntry]);
    expect(out.avgScore).toBeNull();
    expect(out.trend).toBe("No scores yet");
  });

  it("computes Improving/Declining/Steady trend", () => {
    const improving = [5, 5, 5, 1, 1, 1].map((score, i) => {
      const l = lesson({ id: `i-${i}` }) as LessonEntry & { score?: number };
      l.score = score;
      return l as LessonEntry;
    });
    expect(computeSnapshotMetrics(improving).trend).toBe("Improving");

    const declining = [1, 1, 1, 5, 5, 5].map((score, i) => {
      const l = lesson({ id: `d-${i}` }) as LessonEntry & { score?: number };
      l.score = score;
      return l as LessonEntry;
    });
    expect(computeSnapshotMetrics(declining).trend).toBe("Declining");
  });
});

describe("formatRecommendation", () => {
  it("handles falsy, string, object label, and fallback", () => {
    expect(formatRecommendation(null)).toBe("None yet");
    expect(formatRecommendation("Pattern Work")).toBe("Pattern Work");
    expect(formatRecommendation({ title: "Steep Turns" })).toBe("Steep Turns");
    expect(formatRecommendation({ foo: "bar" })).toBe("Available");
  });
});

describe("collectManeuvers", () => {
  it("collects from maneuvers array and singular maneuver", () => {
    const m1 = { name: "Landing" } as Maneuver;
    const m2 = { name: "Slow Flight" } as Maneuver;

    const l1 = lesson({ id: "m1" }) as LessonEntry & { maneuvers?: Maneuver[] };
    l1.maneuvers = [m1];

    const l2 = lesson({ id: "m2" }) as LessonEntry & { maneuver?: Maneuver };
    l2.maneuver = m2;

    const out = collectManeuvers([l1 as LessonEntry, l2 as LessonEntry], null);
    expect(out).toHaveLength(2);
  });

  it("includes recommendedManeuver and deduplicates", () => {
    const m1 = { name: "Landing" } as Maneuver;
    const l1 = lesson({ id: "m3" }) as LessonEntry & { maneuvers?: Maneuver[] };
    l1.maneuvers = [m1];

    const out = collectManeuvers([l1 as LessonEntry], m1);
    expect(out).toHaveLength(1);
  });

  it("handles lessons with no maneuver fields", () => {
    const out = collectManeuvers([lesson({ id: "none" })], null);
    expect(out).toEqual([]);
  });
});