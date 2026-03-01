import type { TodaysTrainingPlan } from "../engine/todaysPlan";

type Props = {
  plan: TodaysTrainingPlan;
  onStartLesson: () => void;
  onSkip: () => void;
  onMarkComplete: () => void;
};

export default function TodaysTrainingPlanCard({
  plan,
  onStartLesson,
  onSkip,
  onMarkComplete,
}: Props) {
  const focusText =
    typeof plan.item === "string"
      ? plan.item
      : "name" in plan.item && typeof plan.item.name === "string"
        ? plan.item.name
        : JSON.stringify(plan.item);

  return (
    <section
      aria-label="today-training-plan"
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h3 style={{ margin: 0 }}>Today’s Training Plan</h3>

      <p style={{ margin: "8px 0 4px" }}>
        <strong>Focus:</strong> {focusText}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Reason:</strong> {plan.reason}
      </p>
      <p style={{ margin: "4px 0 12px" }}>
        <strong>Confidence:</strong> {plan.confidence}% ({plan.source})
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onStartLesson}>
          Start Lesson
        </button>
        <button type="button" onClick={onSkip}>
          Skip
        </button>
        <button type="button" onClick={onMarkComplete}>
          Mark Complete
        </button>
      </div>
    </section>
  );
}
