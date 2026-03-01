import type { LessonEntry } from "../models/lesson";

export type ManeuverRef = {
  id: string;
  name: string;
  category?: string;
};

export type SuggestionReason =
  | "Low score"
  | "Not practiced recently"
  | "Never practiced";

export type ManeuverSuggestion = {
  maneuverId: string;
  name: string;
  category?: string;
  priority: number;
  reasons: SuggestionReason[];
  avgScore: number | null;
  lastPracticedISO: string | null;
};

type BuildSuggestionsInput = {
  studentId: string;
  lessons: LessonEntry[];
  maneuvers: ManeuverRef[];
  recencyWindow: number;
  maxSuggestions?: number;
  now?: Date;
};

type ManeuverStats = {
  sum: number;
  count: number;
  lastPracticedTs: number | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function toNumericScore(score: unknown): number | null {
  if (typeof score === "number" && Number.isFinite(score)) {
    return clamp(score, 0, 5);
  }
  if (typeof score === "string") {
    const parsed = Number(score);
    if (Number.isFinite(parsed)) return clamp(parsed, 0, 5);
  }
  return null;
}

function daysSince(dateISO: string | null, now: Date): number | null {
  if (!dateISO) return null;
  const ts = Date.parse(dateISO);
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, Math.floor((now.getTime() - ts) / 86_400_000));
}

export function buildLessonSuggestions({
  studentId,
  lessons,
  maneuvers,
  recencyWindow,
  maxSuggestions = 5,
  now = new Date(),
}: BuildSuggestionsInput): ManeuverSuggestion[] {
  const studentLessons = lessons.filter((l) => l.studentId === studentId);
  const stats = new Map<string, ManeuverStats>();

  for (const lesson of studentLessons) {
    const lessonTsRaw = Date.parse(lesson.dateISO);
    const lessonTs = Number.isFinite(lessonTsRaw) ? lessonTsRaw : null;

    for (const ms of lesson.maneuverScores ?? []) {
      const maneuverId = typeof ms.maneuverId === "string" ? ms.maneuverId : "";
      if (!maneuverId) continue;

      const current = stats.get(maneuverId) ?? {
        sum: 0,
        count: 0,
        lastPracticedTs: null,
      };

      const numeric = toNumericScore(ms.score);
      if (numeric !== null) {
        current.sum += numeric;
        current.count += 1;
      }

      if (lessonTs !== null) {
        current.lastPracticedTs =
          current.lastPracticedTs === null
            ? lessonTs
            : Math.max(current.lastPracticedTs, lessonTs);
      }

      stats.set(maneuverId, current);
    }
  }

  const safeWindow = clamp(Math.round(recencyWindow || 30), 1, 180);

  const ranked = maneuvers.map((m): ManeuverSuggestion => {
    const s = stats.get(m.id);
    const avgScore = s && s.count > 0 ? s.sum / s.count : null;
    const lastPracticedISO =
      s?.lastPracticedTs != null
        ? new Date(s.lastPracticedTs).toISOString()
        : null;

    const reasons: SuggestionReason[] = [];
    let priority = 0;

    if (!s) {
      reasons.push("Never practiced");
      priority += 70;
    } else {
      const days = daysSince(lastPracticedISO, now);
      if (days !== null && days > safeWindow) {
        reasons.push("Not practiced recently");
        priority += 20 + Math.min(40, ((days - safeWindow) / safeWindow) * 40);
      }

      if (avgScore !== null && avgScore < 3.5) {
        reasons.push("Low score");
        priority += ((3.5 - avgScore) / 3.5) * 50;
      }
    }

    return {
      maneuverId: m.id,
      name: m.name,
      category: m.category,
      priority: Number(priority.toFixed(2)),
      reasons,
      avgScore: avgScore === null ? null : Number(avgScore.toFixed(2)),
      lastPracticedISO,
    };
  });

  return ranked
    .filter((r) => r.priority > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, Math.max(1, maxSuggestions));
}
