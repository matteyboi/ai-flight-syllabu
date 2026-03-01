import { useMemo } from "react";
import type { LessonEntry } from "../models/lesson";
import { buildLessonSuggestions, type ManeuverRef } from "../utils/suggestions";

type Props = {
  studentId: string;
  lessons: LessonEntry[];
  maneuvers: ManeuverRef[];
  recencyWindow: number;
  maxSuggestions?: number;
  onCreateLessonFromSuggestions?: (maneuverIds: string[]) => void;
};

export function SmartLessonSuggestions({
  studentId,
  lessons,
  maneuvers,
  recencyWindow,
  maxSuggestions = 5,
  onCreateLessonFromSuggestions,
}: Props) {
  const suggestions = useMemo(
    () =>
      buildLessonSuggestions({
        studentId,
        lessons,
        maneuvers,
        recencyWindow,
        maxSuggestions,
      }),
    [studentId, lessons, maneuvers, recencyWindow, maxSuggestions]
  );

  return (
    <section aria-label="Smart lesson suggestions">
      <h3>Next Lesson Focus</h3>

      {suggestions.length === 0 ? (
        <p>No suggestions yet. Add more lesson scores to generate recommendations.</p>
      ) : (
        <ul>
          {suggestions.map((s) => (
            <li key={s.maneuverId}>
              <strong>{s.name}</strong>
              {s.category ? ` (${s.category})` : ""} — Priority {s.priority}
              {s.reasons.length > 0 ? ` · ${s.reasons.join(", ")}` : ""}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={suggestions.length === 0 || !onCreateLessonFromSuggestions}
        onClick={() => onCreateLessonFromSuggestions?.(suggestions.map((s) => s.maneuverId))}
      >
        Create lesson from suggestions
      </button>
    </section>
  );
}