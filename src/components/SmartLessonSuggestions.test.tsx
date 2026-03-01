import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import type { LessonEntry } from "../models/lesson";
import { buildLessonSuggestions } from "../utils/suggestions";
import { SmartLessonSuggestions } from "./SmartLessonSuggestions";

vi.mock("../utils/suggestions", () => ({
  buildLessonSuggestions: vi.fn(),
}));

const mockedBuildLessonSuggestions = vi.mocked(buildLessonSuggestions);

describe("SmartLessonSuggestions", () => {
  const lessons: LessonEntry[] = [
    {
      id: "l1",
      studentId: "s1",
      dateISO: "2026-01-01T00:00:00.000Z",
      notes: "",
      status: "Completed",
      patternOnlyDay: false,
      maneuverScores: [{ maneuverId: "m1", score: 2 }],
    },
  ];

  const maneuvers = [
    { id: "m1", name: "Stalls" },
    { id: "m2", name: "Steep Turns" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders and calls create handler", () => {
    const onCreateLessonFromSuggestions = vi.fn();
    mockedBuildLessonSuggestions.mockReturnValue([
      {
        maneuverId: "m1",
        name: "Stalls",
        category: "Airwork",
        priority: 1,
        reasons: ["Low recent score"],
      },
    ]);

    render(
      <SmartLessonSuggestions
        studentId="s1"
        lessons={lessons}
        maneuvers={maneuvers}
        recencyWindow={30}
        onCreateLessonFromSuggestions={onCreateLessonFromSuggestions}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /create lesson from suggestions/i })
    );

    expect(onCreateLessonFromSuggestions).toHaveBeenCalledTimes(1);
    expect(onCreateLessonFromSuggestions).toHaveBeenCalledWith(["m1"]);
  });

  it("shows empty state and disables create button when there are no suggestions", () => {
    mockedBuildLessonSuggestions.mockReturnValue([]);

    render(
      <SmartLessonSuggestions
        studentId="s1"
        lessons={lessons}
        maneuvers={maneuvers}
        recencyWindow={30}
        onCreateLessonFromSuggestions={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        /no suggestions yet\. add more lesson scores to generate recommendations\./i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create lesson from suggestions/i })
    ).toBeDisabled();
  });

  it("disables create button when handler is missing", () => {
    mockedBuildLessonSuggestions.mockReturnValue([
      {
        maneuverId: "m2",
        name: "Steep Turns",
        priority: 2,
        reasons: [],
      },
    ]);

    render(
      <SmartLessonSuggestions
        studentId="s1"
        lessons={lessons}
        maneuvers={maneuvers}
        recencyWindow={30}
      />
    );

    expect(
      screen.getByRole("button", { name: /create lesson from suggestions/i })
    ).toBeDisabled();
  });

  it("renders suggestion details", () => {
    mockedBuildLessonSuggestions.mockReturnValue([
      {
        maneuverId: "m1",
        name: "Stalls",
        category: "Airwork",
        priority: 1,
        reasons: ["Low recent score", "Not practiced recently"],
      },
    ]);

    render(
      <SmartLessonSuggestions
        studentId="s1"
        lessons={lessons}
        maneuvers={maneuvers}
        recencyWindow={30}
        onCreateLessonFromSuggestions={vi.fn()}
      />
    );

    expect(screen.getByText("Stalls")).toBeInTheDocument();
    expect(screen.getByText(/\(Airwork\)/)).toBeInTheDocument();
    expect(screen.getByText(/Priority 1/)).toBeInTheDocument();
    expect(
      screen.getByText(/Low recent score, Not practiced recently/)
    ).toBeInTheDocument();
  });

  it("passes props to buildLessonSuggestions including maxSuggestions", () => {
    mockedBuildLessonSuggestions.mockReturnValue([]);

    render(
      <SmartLessonSuggestions
        studentId="s1"
        lessons={lessons}
        maneuvers={maneuvers}
        recencyWindow={45}
        maxSuggestions={3}
        onCreateLessonFromSuggestions={vi.fn()}
      />
    );

    expect(mockedBuildLessonSuggestions).toHaveBeenCalledTimes(1);
    expect(mockedBuildLessonSuggestions).toHaveBeenCalledWith({
      studentId: "s1",
      lessons,
      maneuvers,
      recencyWindow: 45,
      maxSuggestions: 3,
    });
  });
});