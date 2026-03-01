import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { loadAppState } from "./utils/storage";
import type { Student } from "./models/student";

type LessonLog = {
  id: string;
  studentId: string;
  date: string;
  lesson: string;
  duration: string;
  weakArea: string;
  notes: string;
};

type LessonLogInput = Omit<LessonLog, "id" | "studentId">;

const LOGS_KEY = "flight-lesson-logs-v1";
const STAGE_PROGRESS_KEY = "flight-stage-progress-v1";

function phaseFromSoloStatus(student: Student): string {
  switch (student.soloStatus) {
    case "pre-solo":
      return "Phase 1 — Pre-Solo";
    case "solo-ready":
      return "Phase 2 — Solo Ready";
    case "soloed":
      return "Phase 3 — Soloed";
    default:
      return "Phase — In Progress";
  }
}

function StudentBanner({ student }: { student: Student | null }) {
  if (!student) {
    return (
      <header className="student-banner section-block">
        <h1 className="student-name">No Student Selected</h1>
        <div className="student-meta">
          <p>
            License: <strong>—</strong>
          </p>
          <p>
            Current Phase: <strong>—</strong>
          </p>
        </div>
      </header>
    );
  }

  return (
    <header className="student-banner section-block">
      <h1 className="student-name">{student.name}</h1>
      <div className="student-meta">
        <p>
          License: <strong>{student.license}</strong>
        </p>
        <p>
          Current Phase: <strong>{phaseFromSoloStatus(student)}</strong>
        </p>
      </div>
    </header>
  );
}

function LogLessonPage({
  onAdd,
  canAdd,
}: {
  onAdd: (log: LessonLogInput) => void;
  canAdd: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [lesson, setLesson] = useState("");
  const [duration, setDuration] = useState("");
  const [weakArea, setWeakArea] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canAdd) {
      window.alert("Select a student first.");
      return;
    }
    if (!lesson.trim()) return;

    onAdd({
      date,
      lesson: lesson.trim(),
      duration: duration.trim(),
      weakArea: weakArea.trim(),
      notes: notes.trim(),
    });

    setLesson("");
    setDuration("");
    setWeakArea("");
    setNotes("");
  }

  return (
    <section className="section-block">
      <h2 className="section-title">Log Lesson</h2>
      {!canAdd ? <p>⚠️ Select a student to save logs.</p> : null}

      <form className="lesson-form" onSubmit={submit}>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Lesson
          <input
            type="text"
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            placeholder="Pattern work"
            required
          />
        </label>
        <label>
          Duration
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="1.2h"
          />
        </label>
        <label>
          Weak Area
          <input
            type="text"
            value={weakArea}
            onChange={(e) => setWeakArea(e.target.value)}
            placeholder="Crosswind landings"
          />
        </label>
        <label>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What improved, what needs work"
            rows={3}
          />
        </label>
        <button type="submit" className="primary-btn" disabled={!canAdd}>
          Save Lesson
        </button>
      </form>
    </section>
  );
}

function RecentLogsPage({
  logs,
  onDelete,
  onUpdate,
  onExportAll,
  onImportAll,
}: {
  logs: LessonLog[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, input: LessonLogInput) => void;
  onExportAll: () => void;
  onImportAll: (file: File) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LessonLogInput>({
    date: "",
    lesson: "",
    duration: "",
    weakArea: "",
    notes: "",
  });

  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [weakFilter, setWeakFilter] = useState("");

  const weakOptions = useMemo(
    () =>
      Array.from(
        new Set(
          logs.map((l) => l.weakArea.trim()).filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (weakFilter && l.weakArea.trim() !== weakFilter) return false;
      if (fromDate && l.date < fromDate) return false;
      if (toDate && l.date > toDate) return false;
      if (!q) return true;

      const haystack = `${l.lesson} ${l.notes} ${l.weakArea}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, query, fromDate, toDate, weakFilter]);

  function startEdit(log: LessonLog) {
    setEditingId(log.id);
    setDraft({
      date: log.date,
      lesson: log.lesson,
      duration: log.duration,
      weakArea: log.weakArea,
      notes: log.notes,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    if (!draft.lesson.trim()) return;

    onUpdate(editingId, {
      date: draft.date,
      lesson: draft.lesson.trim(),
      duration: draft.duration.trim(),
      weakArea: draft.weakArea.trim(),
      notes: draft.notes.trim(),
    });
    setEditingId(null);
  }

  function onImportChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportAll(file);
    e.target.value = "";
  }

  function clearFilters() {
    setQuery("");
    setFromDate("");
    setToDate("");
    setWeakFilter("");
  }

  return (
    <section className="section-block">
      <h2 className="section-title">Recent Logs</h2>

      <div className="toolbar-row">
        <button type="button" className="secondary-btn" onClick={onExportAll}>
          Export JSON
        </button>
        <label className="secondary-btn import-btn">
          Import JSON
          <input type="file" accept="application/json" onChange={onImportChange} />
        </label>
      </div>

      <div className="filter-grid">
        <input
          type="text"
          placeholder="Search lesson, notes, weak area..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <select value={weakFilter} onChange={(e) => setWeakFilter(e.target.value)}>
          <option value="">All weak areas</option>
          {weakOptions.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {filteredLogs.length === 0 ? (
        <p>{logs.length === 0 ? "🕘 No logs yet. Add one in Log Lesson." : "No logs match filters."}</p>
      ) : (
        <div className="recent-log-list">
          {filteredLogs.map((l) => {
            const isEditing = editingId === l.id;

            return (
              <div key={l.id} className="recent-log-item">
                {!isEditing ? (
                  <>
                    <div className="recent-log-row">
                      <p>
                        🕘 {l.date} — {l.lesson} {l.duration ? `— ${l.duration}` : ""}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="secondary-btn" onClick={() => startEdit(l)}>
                          Edit
                        </button>
                        <button type="button" className="danger-btn" onClick={() => onDelete(l.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {l.weakArea ? <p>🎯 Weak area: {l.weakArea}</p> : null}
                    {l.notes ? <p className="recent-log-notes">{l.notes}</p> : null}
                  </>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                    />
                    <input
                      type="text"
                      value={draft.lesson}
                      onChange={(e) => setDraft((d) => ({ ...d, lesson: e.target.value }))}
                      placeholder="Lesson"
                    />
                    <input
                      type="text"
                      value={draft.duration}
                      onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
                      placeholder="Duration"
                    />
                    <input
                      type="text"
                      value={draft.weakArea}
                      onChange={(e) => setDraft((d) => ({ ...d, weakArea: e.target.value }))}
                      placeholder="Weak Area"
                    />
                    <textarea
                      rows={3}
                      value={draft.notes}
                      onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                      placeholder="Notes"
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="primary-btn" onClick={saveEdit}>
                        Save
                      </button>
                      <button type="button" className="secondary-btn" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const STAGE_DEFS: Array<{
  id: number;
  title: string;
  minLessons: number;
  requirements: string[];
}> = [
  {
    id: 1,
    title: "Stage 1 — Orientation & Safety",
    minLessons: 0,
    requirements: [
      "Preflight flow and checklist usage",
      "Cockpit setup and sterile cockpit discipline",
      "Airport signage and movement-area awareness",
    ],
  },
  {
    id: 2,
    title: "Stage 2 — Taxi & Basic Aircraft Control",
    minLessons: 3,
    requirements: [
      "Taxi centerline control and brake discipline",
      "Run-up and before-takeoff checklist accuracy",
      "Straight-and-level, basic turns, pitch/power coordination",
    ],
  },
  {
    id: 3,
    title: "Stage 3 — Climbs, Descents, and Slow Flight",
    minLessons: 6,
    requirements: [
      "Normal climbs/descents with target airspeeds",
      "Slow flight recognition and control",
      "Stall awareness and recovery procedure",
    ],
  },
  {
    id: 4,
    title: "Stage 4 — Takeoffs, Landings, and Pattern Work",
    minLessons: 9,
    requirements: [
      "Consistent pattern spacing and radio calls",
      "Normal and crosswind takeoff/landing technique",
      "Go-around decision making and execution",
    ],
  },
  {
    id: 5,
    title: "Stage 5 — Emergency Procedures",
    minLessons: 12,
    requirements: [
      "Engine-failure immediate actions (memory items)",
      "Best glide + suitable landing area selection",
      "System abnormal procedures and checklist reference",
    ],
  },
  {
    id: 6,
    title: "Stage 6 — Navigation & Scenario Flights",
    minLessons: 15,
    requirements: [
      "Pilotage/dead reckoning fundamentals",
      "Diversion planning and fuel/time checks",
      "Task management and workload prioritization",
    ],
  },
  {
    id: 7,
    title: "Stage 7 — Solo Readiness",
    minLessons: 18,
    requirements: [
      "Stable landings with minimal instructor intervention",
      "Consistent checklist/radio/procedural discipline",
      "Demonstrated sound aeronautical decision making",
    ],
  },
  {
    id: 8,
    title: "Stage 8 — Solo Consolidation",
    minLessons: 21,
    requirements: [
      "Consistent solo pattern operations within standards",
      "Independent risk assessment before each flight",
      "Post-flight self-brief identifies 1 improvement item",
    ],
  },
  {
    id: 9,
    title: "Stage 9 — Night Operations",
    minLessons: 24,
    requirements: [
      "Night preflight and lighting system proficiency",
      "Night takeoff/landing technique and visual illusions awareness",
      "Night navigation and radio communication confidence",
    ],
  },
  {
    id: 10,
    title: "Stage 10 — Cross-Country Mastery",
    minLessons: 27,
    requirements: [
      "Complete nav log with fuel/time checkpoints",
      "In-flight reroute/diversion with updated ETA and fuel",
      "Arrival/departure planning for unfamiliar airports",
    ],
  },
  {
    id: 11,
    title: "Stage 11 — Checkride Preparation",
    minLessons: 30,
    requirements: [
      "ACS maneuvers consistently at/near practical test standards",
      "Oral prep: weather, systems, regs, performance",
      "End-to-end mock checkride completion",
    ],
  },
  {
    id: 12,
    title: "Stage 12 — Final Readiness & Standardization",
    minLessons: 33,
    requirements: [
      "No safety/procedural deviations across two consecutive lessons",
      "Strong ADM and checklist discipline without prompting",
      "Instructor sign-off recommendation recorded",
    ],
  },
];

type StageProgressForStudent = Record<string, string[]>;
type StageProgressByStudent = Record<string, StageProgressForStudent>;

function normalizeStageProgress(input: unknown): StageProgressByStudent {
  if (!input || typeof input !== "object") return {};
  const out: StageProgressByStudent = {};

  for (const [studentId, stageMap] of Object.entries(input as Record<string, unknown>)) {
    if (!stageMap || typeof stageMap !== "object") continue;
    const normalizedStageMap: StageProgressForStudent = {};

    for (const [stageId, reqs] of Object.entries(stageMap as Record<string, unknown>)) {
      if (!Array.isArray(reqs)) continue;
      normalizedStageMap[String(stageId)] = reqs.map((r) => String(r).trim()).filter(Boolean);
    }

    out[String(studentId)] = normalizedStageMap;
  }

  return out;
}

function StagesPage({
  logs,
  canEdit,
  progress,
  onToggleRequirement,
  onCompleteStage,
  onResetStage,
  onResetAllStages,
}: {
  logs: LessonLog[];
  canEdit: boolean;
  progress: StageProgressForStudent;
  onToggleRequirement: (stageId: number, requirement: string) => void;
  onCompleteStage: (stageId: number) => void;
  onResetStage: (stageId: number) => void;
  onResetAllStages: () => void;
}) {
  const totalLessons = logs.length;
  const [openAll, setOpenAll] = useState<boolean | null>(null);

  const isReqDone = (stageId: number, req: string) =>
    (progress[String(stageId)] ?? []).includes(req);

  const isStageComplete = (stageId: number, requirements: string[]) =>
    requirements.every((req) => isReqDone(stageId, req));

  const firstIncompleteId = STAGE_DEFS.find(
    (s) => !isStageComplete(s.id, s.requirements),
  )?.id ?? null;

  const totalReqs = STAGE_DEFS.reduce((sum, s) => sum + s.requirements.length, 0);
  const completedReqs = STAGE_DEFS.reduce(
    (sum, s) => sum + s.requirements.filter((r) => isReqDone(s.id, r)).length,
    0,
  );
  const completedStages = STAGE_DEFS.filter((s) => isStageComplete(s.id, s.requirements)).length;
  const progressPct = Math.round((completedReqs / totalReqs) * 100);

  const lastLessonDate = logs.length
    ? [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : "—";

  const weakCounts = logs.reduce<Record<string, number>>((acc, l) => {
    const key = l.weakArea.trim();
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topWeakArea = Object.entries(weakCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  return (
    <>
      <section className="section-block">
        <h2 className="section-title">AI Progress</h2>
        {!canEdit ? <p>⚠️ Select a student to track stage requirements.</p> : null}
        <div className="ai-stats-grid">
          <div className="ai-stat-card">
            <p className="ai-stat-label">Progress</p>
            <p className="ai-stat-value">{progressPct}%</p>
          </div>
          <div className="ai-stat-card">
            <p className="ai-stat-label">Stages Complete</p>
            <p className="ai-stat-value">
              {completedStages}/{STAGE_DEFS.length}
            </p>
          </div>
          <div className="ai-stat-card">
            <p className="ai-stat-label">Last Lesson</p>
            <p className="ai-stat-value">{lastLessonDate}</p>
          </div>
          <div className="ai-stat-card">
            <p className="ai-stat-label">Top Weak Area</p>
            <p className="ai-stat-value">{topWeakArea}</p>
          </div>
        </div>
        <p>📊 Lessons logged: {totalLessons}</p>
        <div className="ai-progress-track" aria-label="Training progress">
          <div className="ai-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      <section className="section-block">
        <h2 className="section-title">{STAGE_DEFS.length} Training Stages</h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button type="button" className="secondary-btn" onClick={() => setOpenAll(true)}>
            Expand All
          </button>
          <button type="button" className="secondary-btn" onClick={() => setOpenAll(false)}>
            Collapse All
          </button>
          <button
            type="button"
            className="primary-btn"
            disabled={!canEdit || firstIncompleteId === null}
            onClick={() => {
              if (firstIncompleteId !== null) onCompleteStage(firstIncompleteId);
            }}
          >
            Mark Current Stage Complete
          </button>
          <button type="button" className="danger-btn" disabled={!canEdit} onClick={onResetAllStages}>
            Reset All Stages
          </button>
        </div>

        <div className="stages-grid">
          {STAGE_DEFS.map((stage) => {
            const complete = isStageComplete(stage.id, stage.requirements);
            const isCurrent = firstIncompleteId !== null && stage.id === firstIncompleteId;
            const blockedByLessons = totalLessons < stage.minLessons;
            const lockedByOrder = firstIncompleteId !== null && stage.id > firstIncompleteId && !complete;
            const locked = blockedByLessons || lockedByOrder;
            const doneCount = stage.requirements.filter((r) => isReqDone(stage.id, r)).length;

            return (
              <article
                key={stage.id}
                className={`stage-block${isCurrent ? " is-current" : ""}${complete ? " is-complete" : ""}`}
              >
                <div className="stage-header">
                  <h3>{stage.title}</h3>
                  <span className="stage-pill">
                    {complete
                      ? "Complete"
                      : blockedByLessons
                        ? `Need ${stage.minLessons} lessons`
                        : isCurrent
                          ? "Current"
                          : "Locked"}
                  </span>
                </div>

                <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
                  Lessons required: {stage.minLessons} • Requirements: {doneCount}/{stage.requirements.length}
                </p>

                <details open={openAll === null ? isCurrent : openAll}>
                  <summary>Requirements</summary>
                  <ul>
                    {stage.requirements.map((req) => {
                      const checked = isReqDone(stage.id, req);
                      return (
                        <li key={req}>
                          <label className="stage-req-item">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canEdit || locked}
                              onChange={() => onToggleRequirement(stage.id, req)}
                            />
                            <span>{req}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </details>

                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={!canEdit}
                    onClick={() => onResetStage(stage.id)}
                  >
                    Clear Stage
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function WeakAreasPage({ logs }: { logs: LessonLog[] }) {
  const counts = logs.reduce<Record<string, number>>((acc, l) => {
    const key = l.weakArea.trim();
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <section className="section-block">
      <h2 className="section-title">Weak Areas</h2>
      {items.length === 0 ? (
        <p>🎯 No weak areas logged yet.</p>
      ) : (
        <div className="recent-log-list">
          {items.map(([name, count]) => (
            <div key={name} className="recent-log-item">
              <p>
                🎯 {name} — <strong>{count}</strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const appState = useMemo(() => loadAppState(), []);
  const selectedStudent = appState.students.find((s) => s.id === appState.selectedStudentId) ?? null;

  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [stageProgress, setStageProgress] = useState<StageProgressByStudent>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOGS_KEY);
      const parsed = raw ? (JSON.parse(raw) as Array<Partial<LessonLog>>) : [];
      const normalized: LessonLog[] = Array.isArray(parsed)
        ? parsed
            .map((l) => ({
              id: String(l.id ?? crypto.randomUUID()),
              studentId: String(l.studentId ?? ""),
              date: String(l.date ?? ""),
              lesson: String(l.lesson ?? ""),
              duration: String(l.duration ?? ""),
              weakArea: String(l.weakArea ?? ""),
              notes: String(l.notes ?? ""),
            }))
            .filter((l) => l.id && l.studentId && l.date && l.lesson)
        : [];

      setLogs(normalized);
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STAGE_PROGRESS_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      setStageProgress(normalizeStageProgress(parsed));
    } catch {
      setStageProgress({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STAGE_PROGRESS_KEY, JSON.stringify(stageProgress));
  }, [stageProgress]);

  const selectedLogs = useMemo(() => {
    if (!selectedStudent) return [];
    return logs
      .filter((l) => l.studentId === selectedStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, selectedStudent]);

  const selectedStageProgress = useMemo<StageProgressForStudent>(() => {
    if (!selectedStudent) return {};
    return stageProgress[selectedStudent.id] ?? {};
  }, [stageProgress, selectedStudent]);

  function toggleStageRequirement(stageId: number, requirement: string) {
    if (!selectedStudent) return;

    const studentId = selectedStudent.id;
    const key = String(stageId);

    setStageProgress((prev) => {
      const studentMap = prev[studentId] ?? {};
      const current = studentMap[key] ?? [];
      const hasReq = current.includes(requirement);
      const nextReqs = hasReq
        ? current.filter((r) => r !== requirement)
        : [...current, requirement];

      return {
        ...prev,
        [studentId]: {
          ...studentMap,
          [key]: nextReqs,
        },
      };
    });
  }

  function addLog(input: LessonLogInput) {
    if (!selectedStudent) return;
    const next: LessonLog = {
      id: crypto.randomUUID(),
      studentId: selectedStudent.id,
      ...input,
    };
    setLogs((prev) => [next, ...prev]);
  }

  function deleteLog(id: string) {
    const ok = window.confirm("Delete this lesson log?");
    if (!ok) return;
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLog(id: string, input: LessonLogInput) {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...input } : l)));
  }

  function exportAllLogs() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      logs,
      stageProgress,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flight-logs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importAllLogs(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      const rawLogs = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { logs?: unknown }).logs)
          ? (parsed as { logs: unknown[] }).logs
          : null;

      if (!rawLogs) {
        window.alert("Invalid JSON format.");
        return;
      }

      const normalized: LessonLog[] = rawLogs
        .map((item) => {
          const l = (item ?? {}) as Partial<LessonLog>;
          return {
            id: String(l.id ?? crypto.randomUUID()),
            studentId: String(l.studentId ?? ""),
            date: String(l.date ?? ""),
            lesson: String(l.lesson ?? ""),
            duration: String(l.duration ?? ""),
            weakArea: String(l.weakArea ?? ""),
            notes: String(l.notes ?? ""),
          };
        })
        .filter((l) => l.id && l.studentId && l.date && l.lesson);

      const importedStageProgress = normalizeStageProgress(
        parsed && typeof parsed === "object"
          ? (parsed as { stageProgress?: unknown }).stageProgress
          : {},
      );

      const ok = window.confirm(
        `Import ${normalized.length} logs and replace current logs/stage progress?`,
      );
      if (!ok) return;

      setLogs(normalized);
      setStageProgress(importedStageProgress);
      window.alert("Logs and stage progress imported.");
    } catch {
      window.alert("Import failed. Check JSON file.");
    }
  }

  function completeStage(stageId: number) {
    if (!selectedStudent) return;
    const stage = STAGE_DEFS.find((s) => s.id === stageId);
    if (!stage) return;
    if (selectedLogs.length < stage.minLessons) {
      window.alert(`This stage unlocks at ${stage.minLessons} lessons.`);
      return;
    }

    const studentId = selectedStudent.id;
    const key = String(stageId);

    setStageProgress((prev) => {
      const studentMap = prev[studentId] ?? {};
      const current = studentMap[key] ?? [];
      const next = Array.from(new Set([...current, ...stage.requirements]));
      return {
        ...prev,
        [studentId]: {
          ...studentMap,
          [key]: next,
        },
      };
    });
  }

  function resetStage(stageId: number) {
    if (!selectedStudent) return;
    const studentId = selectedStudent.id;
    const key = String(stageId);

    setStageProgress((prev) => {
      const studentMap = prev[studentId] ?? {};
      const nextStudentMap = { ...studentMap };
      delete nextStudentMap[key];

      return {
        ...prev,
        [studentId]: nextStudentMap,
      };
    });
  }

  function resetAllStages() {
    if (!selectedStudent) return;
    const ok = window.confirm("Reset all stage requirements for this student?");
    if (!ok) return;

    const studentId = selectedStudent.id;
    setStageProgress((prev) => ({
      ...prev,
      [studentId]: {},
    }));
  }

  return (
    <div className="app-shell">
      <main className="app-content">
        <StudentBanner student={selectedStudent} />

        <Routes>
          <Route path="/" element={<Navigate to="/log-lesson" replace />} />
          <Route
            path="/log-lesson"
            element={<LogLessonPage onAdd={addLog} canAdd={Boolean(selectedStudent)} />}
          />
          <Route
            path="/stages"
            element={
              <StagesPage
                logs={selectedLogs}
                canEdit={Boolean(selectedStudent)}
                progress={selectedStageProgress}
                onToggleRequirement={toggleStageRequirement}
                onCompleteStage={completeStage}
                onResetStage={resetStage}
                onResetAllStages={resetAllStages}
              />
            }
          />
          <Route
            path="/recent-logs"
            element={
              <RecentLogsPage
                logs={selectedLogs}
                onDelete={deleteLog}
                onUpdate={updateLog}
                onExportAll={exportAllLogs}
                onImportAll={importAllLogs}
              />
            }
          />
          <Route path="/weak-areas" element={<WeakAreasPage logs={selectedLogs} />} />
        </Routes>
      </main>

      <nav className="bottom-tabs" aria-label="Primary app tabs">
        <NavLink to="/log-lesson" className={({ isActive }) => `tab-link${isActive ? " active" : ""}`}>
          <span className="emoji">📝</span>
          <span>Log Lesson</span>
        </NavLink>
        <NavLink to="/stages" className={({ isActive }) => `tab-link${isActive ? " active" : ""}`}>
          <span className="emoji">🪜</span>
          <span>Stages</span>
        </NavLink>
        <NavLink to="/recent-logs" className={({ isActive }) => `tab-link${isActive ? " active" : ""}`}>
          <span className="emoji">🕘</span>
          <span>Recent Logs</span>
        </NavLink>
        <NavLink to="/weak-areas" className={({ isActive }) => `tab-link${isActive ? " active" : ""}`}>
          <span className="emoji">🎯</span>
          <span>Weak Areas</span>
        </NavLink>
      </nav>
    </div>
  );
}