import type { CSSProperties } from "react";
import type { Student } from "../models/student";

type SnapshotMetrics = {
  totalLessons?: number;
  lessonCount?: number;
  averageScore?: number | null;
  avgScore?: number | null;
  [key: string]: unknown;
};

type StudentHeaderProps = {
  selectedStudent: Student | null;
  snapshotMetrics: SnapshotMetrics;
  recommendationLabel: string;
  stagePhaseStatus: string;
  unlockedStage: number;
  patternOnlyDay: boolean;
};

const cardStyle: CSSProperties = {
  marginBottom: 14,
  padding: 14,
  borderRadius: 14,
  background: "#132644",
  border: "1px solid #42a5f533",
  boxShadow: "0 4px 14px #1976d222",
  color: "#e6f1ff",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
};

const chipStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#1f3a66",
  border: "1px solid #42a5f544",
  color: "#dbeafe",
  fontSize: 12,
  lineHeight: 1.2,
};

function readNumber(obj: SnapshotMetrics, keys: string[]): number | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export function StudentHeader({
  selectedStudent,
  snapshotMetrics,
  recommendationLabel,
  stagePhaseStatus,
  unlockedStage,
  patternOnlyDay,
}: StudentHeaderProps) {
  const lessonCount = readNumber(snapshotMetrics, ["totalLessons", "lessonCount"]) ?? 0;

  return (
    <header style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>
            {selectedStudent ? selectedStudent.name : "Flight Syllabus"}
          </div>
          <div style={{ opacity: 0.85, fontSize: 13, marginTop: 2 }}>
            {selectedStudent
              ? `${selectedStudent.license.toUpperCase()} • ${selectedStudent.soloStatus}`
              : "Select a student to begin"}
          </div>
        </div>

        <div style={{ fontSize: 13, opacity: 0.9 }}>Unlocked Stage: {unlockedStage}</div>
      </div>

      <div style={rowStyle}>
        <span style={chipStyle}>Status: {stagePhaseStatus}</span>
        <span style={chipStyle}>Recommendation: {recommendationLabel}</span>
        <span style={chipStyle}>Lessons: {lessonCount}</span>
        {patternOnlyDay ? <span style={chipStyle}>Pattern-only day</span> : null}
      </div>
    </header>
  );
}