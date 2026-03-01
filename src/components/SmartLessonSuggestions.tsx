import { useMemo } from "react";
import type { LessonEntry } from "../models/lesson";
import { buildLessonSuggestions } from "../utils/suggestions";

type Maneuver = {
  id: string;
  name: string;
  category?: string;
};

type SmartLessonSuggestionsProps = {
  studentId: string;
  lessons: LessonEntry[];
  maneuvers: Maneuver[];
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
}: SmartLessonSuggestionsProps) {
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

  const canCreate =
    suggestions.length > 0 && typeof onCreateLessonFromSuggestions === "function";

  const handleCreate = () => {
    if (!onCreateLessonFromSuggestions) return;
    onCreateLessonFromSuggestions(suggestions.map((s) => s.maneuverId));
  };

  return (
    <section>
      <h3>Smart Lesson Suggestions</h3>

      {suggestions.length === 0 ? (
        <p>No suggestions yet. Add more lesson scores to generate recommendations.</p>
      ) : (
        <ul>
          {suggestions.map((s) => (
            <li key={s.maneuverId}>
              <strong>{s.name}</strong>
              {s.category ? ` (${s.category})` : ""}
              {` Priority ${s.priority}`}
              {s.reasons.length > 0 ? ` ${s.reasons.join(", ")}` : ""}
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={handleCreate} disabled={!canCreate}>
        Create Lesson from Suggestions
      </button>
    </section>
  );
}
