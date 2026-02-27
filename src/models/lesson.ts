export type ManeuverScore = 1 | 2 | 3 | 4 | 5;

export type LessonStatus = "Needs Work" | "Progressing" | "Complete";

export type Maneuver = {
  id: string;
  name: string;
  stage: number; // 1–7
  isSafetyCritical: boolean;
};

export type LessonEntry = {
  id: string;
  studentId: string;
  dateISO: string;
  maneuverScores: {
    maneuverId: string;
    score: ManeuverScore;
  }[];
  notes: string;
  patternOnlyDay: boolean;
  status: LessonStatus;
};