import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import type { LessonEntry } from "../models/lesson";
import { buildLessonSuggestions } from "../utils/suggestions";
import { SmartLessonSuggestions } from "./SmartLessonSuggestions";

vi.mock("../utils/suggestions", () => ({
  buildLessonSuggestions: vi.fn(),
}));

const mockedBuildLessonSuggestions = vi.mocked(buildLessonSuggestions);

type MockSuggestionReasons = ReturnType<
  typeof buildLessonSuggestions
>[number]["reasons"];

const mockReasons = (...reasons: string[]) =>
  reasons as unknown as MockSuggestionReasons;

const lessons: LessonEntry[] = [
  {
    id: "l1",
    studentId: "s1",
    dateISO: "2026-01-01T00:00:00.000Z",
    notes: "",
    status: "Complete",
    patternOnlyDay: false,
    maneuverScores: [{ maneuverId: "m1", score: 2 }],
  },
];

const maneuvers = [
  { id: "m1", name: "Stalls" },
  { id: "m2", name: "Steep Turns" },
];

const renderComponent = (
  props: Partial<Parameters<typeof SmartLessonSuggestions>[0]> = {},
) =>
  render(
    <SmartLessonSuggestions
      studentId="s1"
      lessons={lessons}
      maneuvers={maneuvers}
      recencyWindow={30}
      onCreateLessonFromSuggestions={vi.fn()}
      {...props}
    />,
  );

describe("SmartLessonSuggestions", () => {
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
          reasons: mockReasons("Low recent score"),
          avgScore: null,
          lastPracticedISO: null
      },
    ]);

    renderComponent({ onCreateLessonFromSuggestions });

    fireEvent.click(
      screen.getByRole("button", { name: /create lesson from suggestions/i }),
    );

    expect(onCreateLessonFromSuggestions).toHaveBeenCalledTimes(1);
    expect(onCreateLessonFromSuggestions).toHaveBeenCalledWith(["m1"]);
  });

  it("shows empty state and disables create button when there are no suggestions", () => {
    mockedBuildLessonSuggestions.mockReturnValue([]);

    renderComponent();

    expect(
      screen.getByText(
        /no suggestions yet\. add more lesson scores to generate recommendations\./i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create lesson from suggestions/i }),
    ).toBeDisabled();
  });

  it("disables create button when handler is missing", () => {
    mockedBuildLessonSuggestions.mockReturnValue([
      {
          maneuverId: "m2", name: "Steep Turns", priority: 2, reasons: [],
          avgScore: null,
          lastPracticedISO: null
      },
    ]);

    renderComponent({ onCreateLessonFromSuggestions: undefined });

    expect(
      screen.getByRole("button", { name: /create lesson from suggestions/i }),
    ).toBeDisabled();
  });

  it("renders suggestion details", () => {
    mockedBuildLessonSuggestions.mockReturnValue([
      {
          maneuverId: "m1",
          name: "Stalls",
          category: "Airwork",
          priority: 1,
          reasons: mockReasons("Low recent score", "Not practiced recently"),
          avgScore: null,
          lastPracticedISO: null
      },
    ]);

    renderComponent();

    expect(screen.getByText("Stalls")).toBeInTheDocument();
    expect(screen.getByText(/\(Airwork\)/)).toBeInTheDocument();
    expect(screen.getByText(/Priority 1/)).toBeInTheDocument();
    expect(
      screen.getByText(/Low recent score, Not practiced recently/),
    ).toBeInTheDocument();
  });

  it("passes props to buildLessonSuggestions including maxSuggestions", () => {
    mockedBuildLessonSuggestions.mockReturnValue([]);

    renderComponent({ recencyWindow: 45, maxSuggestions: 3 });

    expect(mockedBuildLessonSuggestions).toHaveBeenCalledWith({
      studentId: "s1",
      lessons,
      maneuvers,
      recencyWindow: 45,
      maxSuggestions: 3,
    });
  });

  it("uses default maxSuggestions=5 when prop is omitted", () => {
    mockedBuildLessonSuggestions.mockReturnValue([]);

    renderComponent();

    expect(mockedBuildLessonSuggestions).toHaveBeenCalledWith({
      studentId: "s1",
      lessons,
      maneuvers,
      recencyWindow: 30,
      maxSuggestions: 5,
    });
  });

  it("calls create handler with all suggestion maneuver ids in order", () => {
    const onCreateLessonFromSuggestions = vi.fn();
    mockedBuildLessonSuggestions.mockReturnValue([
      {
          maneuverId: "m2",
          name: "Steep Turns",
          category: "Airwork",
          priority: 1,
          reasons: [],
          avgScore: null,
          lastPracticedISO: null
      },
      {
          maneuverId: "m1",
          name: "Stalls",
          category: "Airwork",
          priority: 2,
          reasons: [],
          avgScore: null,
          lastPracticedISO: null
      },
    ]);

    renderComponent({ onCreateLessonFromSuggestions });

    fireEvent.click(
      screen.getByRole("button", { name: /create lesson from suggestions/i }),
    );

    expect(onCreateLessonFromSuggestions).toHaveBeenCalledWith(["m2", "m1"]);
  });

  it("does not render category text when category is missing", () => {
    mockedBuildLessonSuggestions.mockReturnValue([
      {
          maneuverId: "m2", name: "Steep Turns", priority: 2, reasons: [],
          avgScore: null,
          lastPracticedISO: null
      },
    ]);

    renderComponent();

    const row = screen.getByText(/Steep Turns/).closest("li");
    expect(row).toBeInTheDocument();
    expect(row?.textContent).not.toContain("(");
    expect(row?.textContent).not.toContain(")");
  });

  it("does not render reasons separator when reasons are empty", () => {
    mockedBuildLessonSuggestions.mockReturnValue([
      {
          maneuverId: "m2",
          name: "Steep Turns",
          category: "Airwork",
          priority: 2,
          reasons: [],
          avgScore: null,
          lastPracticedISO: null
      },
    ]);

    renderComponent();

    const row = screen.getByText(/Steep Turns/).closest("li");
    expect(row).toBeInTheDocument();
    expect(row?.textContent).not.toContain("·");
  });

  it("recomputes suggestions when a dependency prop changes", () => {
    mockedBuildLessonSuggestions.mockReturnValue([]);

    const { rerender } = renderComponent();

    rerender(
      <SmartLessonSuggestions
        studentId="s1"
        lessons={lessons}
        maneuvers={maneuvers}
        recencyWindow={31}
        onCreateLessonFromSuggestions={vi.fn()}
      />,
    );

    expect(mockedBuildLessonSuggestions).toHaveBeenCalledTimes(2);
    expect(mockedBuildLessonSuggestions).toHaveBeenLastCalledWith({
      studentId: "s1",
      lessons,
      maneuvers,
      recencyWindow: 31,
      maxSuggestions: 5,
    });
  });
});
