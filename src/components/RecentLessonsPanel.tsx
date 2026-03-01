import type { LessonEntry } from "../models/lesson";

type RecentLessonsPanelProps = {
  lessons: LessonEntry[];
  onDeleteLesson: (lessonId: string) => void;
};

export function RecentLessonsPanel({
  lessons,
  onDeleteLesson,
}: RecentLessonsPanelProps) {
  const sortedLessons = [...lessons].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
  );

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
        Recent Lessons
      </h2>

      <div
        style={{
          marginTop: 8,
          color: "#e3f2fd",
          fontSize: 14,
          display: "grid",
          gap: 8,
        }}
      >
        {sortedLessons.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No lessons yet</div>
        ) : (
          sortedLessons.map((lesson) => (
            <div
              key={lesson.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                background: "#1b2a4a",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <div>
                {new Date(lesson.dateISO).toLocaleDateString()} (
                {lesson.notes || "No notes"})
              </div>
              <button
                type="button"
                onClick={() => onDeleteLesson(lesson.id)}
                style={{ cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
