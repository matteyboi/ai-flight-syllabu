import { describe, expect, it } from "vitest";
import type { LessonEntry } from "../models/lesson";
import { buildLessonSuggestions } from "./suggestions";

function lesson(partial: Partial<LessonEntry>): LessonEntry {
  return {
    id: partial.id ?? "l1",
    studentId: partial.studentId ?? "s1",
    dateISO: partial.dateISO ?? "2026-01-01T00:00:00.000Z",
    notes: partial.notes ?? "",
    status: (partial.status ?? "Unknown") as LessonEntry["status"],
    patternOnlyDay: partial.patternOnlyDay ?? false,
    maneuverScores: partial.maneuverScores ?? [],
  } as LessonEntry;
}

describe("buildLessonSuggestions", () => {
  it("prioritizes never-practiced maneuvers", () => {
    const lessons = [
      lesson({ maneuverScores: [{ maneuverId: "m1", score: 4 }] }),
    ];

    const result = buildLessonSuggestions({
      studentId: "s1",
      lessons,
      maneuvers: [
        { id: "m1", name: "Stalls" },
        { id: "m2", name: "Steep Turns" },
      ],
      recencyWindow: 30,
      now: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(result[0]?.maneuverId).toBe("m2");
    expect(result[0]?.reasons).toContain("Never practiced");
  });

  it("flags low score and stale recency", () => {
    const lessons = [
      lesson({
        dateISO: "2025-11-01T00:00:00.000Z",
        maneuverScores: [{ maneuverId: "m1", score: 2 }],
      }),
    ];

    const result = buildLessonSuggestions({
      studentId: "s1",
      lessons,
      maneuvers: [{ id: "m1", name: "Landings" }],
      recencyWindow: 30,
      now: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.reasons).toContain("Low score");
    expect(result[0]?.reasons).toContain("Not practiced recently");
  });

  it("respects maxSuggestions", () => {
    const result = buildLessonSuggestions({
      studentId: "s1",
      lessons: [],
      maneuvers: [
        { id: "m1", name: "A" },
        { id: "m2", name: "B" },
        { id: "m3", name: "C" },
      ],
      recencyWindow: 30,
      maxSuggestions: 2,
      now: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(result).toHaveLength(2);
  });
});
