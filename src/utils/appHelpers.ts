import type { LessonEntry, Maneuver, SnapshotMetrics } from "../models/lesson";

type LessonWithOptionalFields = LessonEntry & {
  score?: number;
  maneuver?: Maneuver;
  maneuvers?: Maneuver[];
};

type ComputeSnapshotMetricsInput =
  | LessonEntry[]
  | {
      lessons: LessonEntry[];
      selectedStudent?: unknown; // accepted but not required by metrics computation
    };

export function computeSnapshotMetrics(input: ComputeSnapshotMetricsInput): SnapshotMetrics {
  const lessons = Array.isArray(input) ? input : input.lessons;

  if (lessons.length === 0) {
    return {
      lastLessonDate: "No lessons yet",
      avgScore: null,
      trend: "No trend yet",
    };
  }

  const sorted = [...lessons].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );

  const lastDate = new Date(sorted[0].dateISO);
  const lastLessonDate = Number.isNaN(lastDate.getTime())
    ? "Unknown"
    : lastDate.toLocaleDateString();

  const scored = sorted
    .map((l) => (l as LessonWithOptionalFields).score)
    .filter((s): s is number => typeof s === "number" && Number.isFinite(s));

  if (scored.length === 0) {
    return {
      lastLessonDate,
      avgScore: null,
      trend: "No scores yet",
    };
  }

  const avgScore = scored.reduce((a, b) => a + b, 0) / scored.length;
  const recent = scored.slice(0, 3);
  const prior = scored.slice(3, 6);

  const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : avgScore;
  const priorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : recentAvg;

  const delta = recentAvg - priorAvg;
  const trend = delta >= 2 ? "Improving" : delta <= -2 ? "Declining" : "Steady";

  return { lastLessonDate, avgScore, trend };
}

export function formatRecommendation(rec: unknown): string {
  if (!rec) return "None yet";
  if (typeof rec === "string") return rec;
  if (typeof rec === "object") {
    const r = rec as Record<string, unknown>;
    const label = [r.title, r.lessonTitle, r.label, r.code].find(
      (v): v is string => typeof v === "string" && v.trim().length > 0
    );
    if (label) return label;
  }
  return "Available";
}

function getLessonManeuvers(lesson: LessonEntry): Maneuver[] {
  const l = lesson as LessonWithOptionalFields;
  if (Array.isArray(l.maneuvers)) return l.maneuvers;
  return l.maneuver ? [l.maneuver] : [];
}

export function collectManeuvers(
  lessons: LessonEntry[],
  recommendedManeuver: Maneuver | null
): Maneuver[] {
  const set = new Set<Maneuver>();
  lessons.forEach((l) => getLessonManeuvers(l).forEach((m) => set.add(m)));
  if (recommendedManeuver) set.add(recommendedManeuver);
  return Array.from(set);
}