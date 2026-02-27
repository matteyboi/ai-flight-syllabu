import type { LessonStatus } from "../models/lesson";

type StageProgressPanelProps = {
  unlockedStage: number;
  status?: LessonStatus;
};

export function StageProgressPanel({
  unlockedStage,
  status = "Progressing",
}: StageProgressPanelProps) {
  return (
    <div
      style={{
        background: "#162447",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 2px 8px #1976d244",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 16,
            background: "linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Unlocked Stage: {unlockedStage}
        </h2>

        <div
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #2e5d90",
            background: "#0f2b52",
            color: "#90caf9",
            fontWeight: 700,
          }}
        >
          Status: {status}
        </div>
      </div>
    </div>
  );
}