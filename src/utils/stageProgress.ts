export type StageLockMetrics = {
  avgScore?: number | null;
  trend?: string;
  totalLessons?: number;
  lessonCount?: number;
};

export function getStageLockReason(
  stageNumber: number,
  metrics: StageLockMetrics,
): string {
  const lessonCount = metrics.totalLessons ?? metrics.lessonCount ?? 0;
  const requiredRecentLessons = Math.max(2, stageNumber - 1);

  if (lessonCount < requiredRecentLessons) {
    return `Need ${requiredRecentLessons} recent lessons (have ${lessonCount}).`;
  }

  if (metrics.avgScore == null || metrics.avgScore < 3) {
    return "Need average score ≥ 3.0.";
  }

  if (metrics.trend === "Declining") {
    return "Need trend: Steady or Improving.";
  }

  return "Complete prior stage requirements first.";
}
