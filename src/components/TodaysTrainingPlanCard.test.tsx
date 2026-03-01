import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TodaysTrainingPlanCard from "./TodaysTrainingPlanCard";

describe("TodaysTrainingPlanCard", () => {
  it("renders content and fires actions", () => {
    const onStartLesson = vi.fn();
    const onSkip = vi.fn();
    const onMarkComplete = vi.fn();

    render(
      <TodaysTrainingPlanCard
        plan={{
          item: "Slow Flight",
          reason: "Recent performance suggests extra practice here.",
          confidence: 78,
          source: "weak-area",
        }}
        onStartLesson={onStartLesson}
        onSkip={onSkip}
        onMarkComplete={onMarkComplete}
      />,
    );

    expect(screen.getByText("Today’s Training Plan")).toBeTruthy();
    expect(screen.getByText(/Slow Flight/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Start Lesson" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark Complete" }));

    expect(onStartLesson).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onMarkComplete).toHaveBeenCalledTimes(1);
  });
});
