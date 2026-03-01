import { describe, expect, it } from "vitest";
import { getStageLockReason } from "./stageProgress";

describe("getStageLockReason", () => {
  it("requires minimum recent lessons", () => {
    expect(
      getStageLockReason(4, {
        totalLessons: 2,
        avgScore: 4,
        trend: "Improving",
      }),
    ).toBe("Need 3 recent lessons (have 2).");
  });

  it("requires average score >= 3.0", () => {
    expect(
      getStageLockReason(3, {
        totalLessons: 5,
        avgScore: 2.9,
        trend: "Steady",
      }),
    ).toBe("Need average score ≥ 3.0.");
  });

  it("requires non-declining trend", () => {
    expect(
      getStageLockReason(3, {
        totalLessons: 5,
        avgScore: 3.4,
        trend: "Declining",
      }),
    ).toBe("Need trend: Steady or Improving.");
  });

  it("falls back to prior-stage requirement", () => {
    expect(
      getStageLockReason(3, {
        totalLessons: 5,
        avgScore: 3.4,
        trend: "Steady",
      }),
    ).toBe("Complete prior stage requirements first.");
  });

  it("uses lessonCount when totalLessons is missing", () => {
    expect(
      getStageLockReason(3, {
        lessonCount: 1,
        avgScore: 4,
        trend: "Improving",
      }),
    ).toBe("Need 2 recent lessons (have 1).");
  });
});
