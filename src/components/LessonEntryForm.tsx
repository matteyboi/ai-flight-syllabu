import { useMemo, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import type { LessonEntry, Maneuver, ManeuverScore } from "../models/lesson";

type LessonEntryFormProps = {
  recommended: Maneuver | null;
  maneuvers: Maneuver[];
  onSubmit: (lesson: Omit<LessonEntry, "id" | "studentId">) => void;
};

export function LessonEntryForm({ recommended, maneuvers, onSubmit }: LessonEntryFormProps) {
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [patternOnlyDay, setPatternOnlyDay] = useState(false);
  const [scoreByManeuverId, setScoreByManeuverId] = useState<Record<string, ManeuverScore | undefined>>({});

  const sortedManeuvers = useMemo(
    () => [...maneuvers].sort((a, b) => a.stage - b.stage || a.name.localeCompare(b.name)),
    [maneuvers]
  );

  const handleScoreChange = (maneuverId: string, value: string) => {
    if (!value) {
      setScoreByManeuverId((prev) => ({ ...prev, [maneuverId]: undefined }));
      return;
    }
    const score = Number(value) as ManeuverScore;
    setScoreByManeuverId((prev) => ({ ...prev, [maneuverId]: score }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const maneuverScores = Object.entries(scoreByManeuverId)
      .filter(([, score]) => typeof score === "number")
      .map(([maneuverId, score]) => ({
        maneuverId,
        score: score as ManeuverScore,
      }));

    onSubmit({
      dateISO: new Date(`${dateISO}T12:00:00`).toISOString(),
      notes: notes.trim(),
      patternOnlyDay,
      status: "Progressing",
      maneuverScores,
    });

    setNotes("");
    setPatternOnlyDay(false);
    setScoreByManeuverId({});
  };

  const inputBaseStyle: CSSProperties = {
    width: "100%",
    border: "1px solid #2e4c7a",
    borderRadius: 10,
    background: "#101d3a",
    color: "#e3f2fd",
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "linear-gradient(180deg, #162447 0%, #13223f 100%)",
        border: "1px solid #2a4b78",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 8px 24px #0b132433, 0 2px 8px #1976d244",
        color: "#e3f2fd",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 0.2,
            background: "linear-gradient(90deg, #7ec8ff 0%, #42a5f5 50%, #1976d2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Log Lesson
        </h2>

        <div
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #2e5d90",
            background: "#0f2b52",
            color: "#90caf9",
            whiteSpace: "nowrap",
          }}
        >
          Recommended: {recommended ? recommended.name : "None"}
        </div>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#bbdefb" }}>Date</span>
        <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} required style={inputBaseStyle} />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#bbdefb" }}>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="What was practiced? What improved? What needs work?"
          style={{ ...inputBaseStyle, resize: "vertical", minHeight: 92, lineHeight: 1.4 }}
        />
      </label>

      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#bbdefb" }}>Maneuver Scores (optional)</span>
        <div style={{ display: "grid", gap: 8, maxHeight: 260, overflow: "auto", paddingRight: 2 }}>
          {sortedManeuvers.map((m) => (
            <div
              key={m.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px",
                gap: 8,
                alignItems: "center",
                background: "#102a50",
                border: "1px solid #2e4c7a",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              <div style={{ fontSize: 13 }}>
                {m.name} <span style={{ opacity: 0.75 }}>(Stage {m.stage})</span>
              </div>
              <select
                value={scoreByManeuverId[m.id] ?? ""}
                onChange={(e) => handleScoreChange(m.id, e.target.value)}
                style={{ ...inputBaseStyle, padding: "8px 10px" }}
              >
                <option value="">—</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "#cfe8ff",
            background: "#102a50",
            border: "1px solid #2e4c7a",
            borderRadius: 10,
            padding: "10px 12px",
          }}
        >
          <input
            type="checkbox"
            checked={patternOnlyDay}
            onChange={(e) => setPatternOnlyDay(e.target.checked)}
            style={{ accentColor: "#42a5f5" }}
          />
          Pattern-only day
        </label>
      </div>

      <button
        type="submit"
        style={{
          border: "none",
          borderRadius: 10,
          padding: "11px 14px",
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
          color: "#fff",
          background: "linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)",
          boxShadow: "0 6px 18px #1976d266",
        }}
      >
        Save Lesson
      </button>
    </form>
  );
}