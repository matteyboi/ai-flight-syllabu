import type { LessonEntry } from "../models/lesson";

type WeakestManeuversPanelProps = {
  lessons: LessonEntry[];
};

export function WeakestManeuversPanel({ lessons }: WeakestManeuversPanelProps) {
  const lessonCount = lessons.length;

  return (
    <div
      style={{
        background: "#162447",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 2px 8px #1976d244",
        marginBottom: 0,
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
        Weakest Maneuvers
      </h2>
      <div style={{ marginTop: 6, color: "#e3f2fd", fontSize: 14 }}>
        (Sample content)
      </div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Analyzing {lessonCount} lessons
      </div>
    </div>
  );
}