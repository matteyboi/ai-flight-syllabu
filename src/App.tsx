import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { RecentLessonsPanel } from "./components/RecentLessonsPanel";
import { StudentRoster } from "./components/StudentRoster";
import { LessonEntryForm } from "./components/LessonEntryForm";
import { StageProgressPanel } from "./components/StageProgressPanel";
import { WeakestManeuversPanel } from "./components/WeakestManeuversPanel";
import { StudentHeader } from "./components/StudentHeader";
import { SettingsPanel } from "./components/SettingsPanel";
import type { BackupPayloadV1, BackupValidationReport } from "./utils/backup";

import type { LicenseType, Student } from "./models/student";
import type { LessonEntry, Maneuver, LessonStatus } from "./models/lesson";
import type { AppSettings } from "./models/settings";

import { recommendNextLesson } from "./engine/recommendation";
import { computeUnlockedStage } from "./engine/stageUnlock";
import {
  collectManeuvers,
  computeSnapshotMetrics,
  formatRecommendation,
} from "./utils/appHelpers";
import { getStageLockReason } from "./utils/stageProgress";
import { loadAppState, loadLessons, saveAppState, saveLessons, loadSettings, saveSettings } from "./utils/storage";
import {
  createBackupJson,
  parseBackupJson,
  validateBackupPayload,
} from "./utils/backup";

type ImportSnapshot = {
  appState: {
    students: Student[];
    selectedStudentId: string | null;
  };
  lessons: LessonEntry[];
  settings: AppSettings;
};

type SnapshotMetrics = ReturnType<typeof computeSnapshotMetrics>;

const STAGES = [
  { stageNumber: 1, title: "Ground School" },
  { stageNumber: 2, title: "Solo" },
  { stageNumber: 3, title: "Cross Country" },
  { stageNumber: 4, title: "Flight Training" },
  { stageNumber: 5, title: "Advanced Training" },
] as const;

const noticeCardStyle: CSSProperties = {
  background: "#1f2937",
  border: "1px solid #42a5f544",
  color: "#dbeafe",
  borderRadius: 12,
  padding: 12,
};

const lockedChipStyle: CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 9999,
  background: "#374151",
  color: "#d1d5db",
};

const lockedReasonStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: "#fca5a5",
};

function App() {
  const initial = useMemo(() => loadAppState(), []);
  const initialSettings = useMemo(() => loadSettings(), []);

  const [students, setStudents] = useState<Student[]>(initial.students);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    initial.selectedStudentId
  );
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [lessons, setLessons] = useState<LessonEntry[]>(() => loadLessons());

  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    payload: BackupPayloadV1;
    validation: BackupValidationReport;
  } | null>(null);

  const [lastImportSnapshot, setLastImportSnapshot] = useState<ImportSnapshot | null>(null);

  const applySnapshot = (snapshot: ImportSnapshot): void => {
    setStudents(snapshot.appState.students);
    setSelectedStudentId(snapshot.appState.selectedStudentId);
    setLessons(snapshot.lessons);
    setSettings(snapshot.settings);
  };

  const takeCurrentSnapshot = (): ImportSnapshot => ({
    appState: { students, selectedStudentId },
    lessons,
    settings,
  });

  const patternOnlyDay = settings.patternOnlyDay;
  const recencyWindow = settings.recencyWindow;

  useEffect(() => {
    saveAppState({ students, selectedStudentId });
  }, [students, selectedStudentId]);

  useEffect(() => {
    saveLessons(lessons);
  }, [lessons]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
  };

  const handleAddStudent = (name: string, license: LicenseType) => {
    const now = new Date().toISOString();
    const student: Student = {
      id: crypto.randomUUID(),
      name,
      license,
      soloStatus: "pre-solo",
      checklist: {
        tsaA14: false,
        iacra: false,
        medical: false,
        writtenTestPassed: false,
      },
      endorsements: {
        soloEndorsementGiven: false,
        soloEndorsementDateISO: null,
      },
      milestones: {
        firstSoloCompleted: false,
        firstSoloDateISO: null,
      },
      createdAtISO: now,
      updatedAtISO: now,
    };

    setStudents((prev) => [...prev, student]);
    setSelectedStudentId(student.id);
  };

  const handleEditStudent = (id: string, name: string, license: LicenseType) => {
    const now = new Date().toISOString();
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name, license, updatedAtISO: now } : s))
    );
  };

  const handleDeleteStudent = (id: string) => {
    const ok = window.confirm("Delete this student?");
    if (!ok) return;

    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSelectedStudentId((prevSelected) => (prevSelected === id ? null : prevSelected));
    setLessons((prev) => prev.filter((l) => l.studentId !== id));
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const handleExportBackup = () => {
    const json = createBackupJson({
      appState: { students, selectedStudentId },
      lessons,
      settings,
    });

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-flight-syllabus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (file: File) => {
    try {
      const raw = await file.text();
      const payload = parseBackupJson(raw);
      const validation = validateBackupPayload(payload);
      setPendingImport({ fileName: file.name, payload, validation });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import backup.";
      window.alert(message);
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    if (pendingImport.validation.hasCriticalIssues) {
      window.alert("Import blocked: backup has validation issues.");
      return;
    }

    const { payload } = pendingImport;
    setLastImportSnapshot(takeCurrentSnapshot());
    applySnapshot({
      appState: payload.appState,
      lessons: payload.lessons,
      settings: payload.settings,
    });
    setPendingImport(null);
    window.alert("Backup imported.");
  };

  function handleCancelImport(): void {
    setPendingImport(null);
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;

  const studentLessons = useMemo(() => {
    if (!selectedStudent) return [];
    return lessons
      .filter((l) => l.studentId === selectedStudent.id)
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [lessons, selectedStudent]);

  const currentStatus: LessonStatus | null = studentLessons[0]?.status ?? null;
  const stagePhaseStatus = currentStatus ?? "No status yet";

  const unlockedStage = useMemo(() => {
    if (!selectedStudent) return 1; // default when no student selected

    return computeUnlockedStage(studentLessons, {
      medical: selectedStudent.checklist.medical,
      tsaA14: selectedStudent.checklist.tsaA14,
    });
  }, [selectedStudent, studentLessons]);

  // Keep selectedStage valid when student/unlock state changes.
  useEffect(() => {
    if (!selectedStudent) return;

    const id = window.setTimeout(() => {
      setSelectedStage((prev) => {
        const minStage = 1;
        const maxStage = Math.max(minStage, unlockedStage);
        const clamped = Math.min(Math.max(prev, minStage), maxStage);
        return clamped === prev ? prev : clamped;
      });
    }, 0);

    return () => window.clearTimeout(id);
  }, [selectedStudent, unlockedStage]);

  const snapshotMetrics = useMemo(
    () => computeSnapshotMetrics(studentLessons),
    [studentLessons]
  );

  const metrics: SnapshotMetrics = snapshotMetrics;

  const recommendation = useMemo(() => {
    if (!selectedStudent) return null;
    return recommendNextLesson({
      lessons: studentLessons,
      unlockedStage,
      patternOnlyDay,
      recencyWindow,
    });
  }, [selectedStudent, studentLessons, unlockedStage, patternOnlyDay, recencyWindow]);

  const recommendationLabel = formatRecommendation(recommendation);
  const recommendedManeuver: Maneuver | null = recommendation?.maneuver ?? null;

  const maneuvers: Maneuver[] = useMemo(
    () => collectManeuvers(lessons, recommendedManeuver),
    [lessons, recommendedManeuver]
  );

  const handleAddLesson = (input: Omit<LessonEntry, "id" | "studentId">) => {
    if (!selectedStudent) return;

    const newLesson: LessonEntry = {
      id: crypto.randomUUID(),
      studentId: selectedStudent.id,
      ...input,
    };

    setLessons((prev) => [...prev, newLesson]);
  };

  const isStageLocked = useCallback(
    (stageNumber: number) => stageNumber > unlockedStage,
    [unlockedStage]
  );

  const stageLockReasons = useMemo(() => {
    return STAGES.reduce<Record<number, string>>((acc, stage) => {
      const locked = isStageLocked(stage.stageNumber);
      acc[stage.stageNumber] = locked ? getStageLockReason(stage.stageNumber, metrics) : "";
      return acc;
    }, {});
  }, [isStageLocked, metrics]);

  function handleUndoLastImport(): void {
    if (!lastImportSnapshot) return;
    applySnapshot(lastImportSnapshot);
    setLastImportSnapshot(null);
    setPendingImport(null);
  }

  return (
    <>
      <div
        style={{
          padding: 16,
          maxWidth: 1400,
          margin: "0 auto",
          borderRadius: 24,
          background: "rgba(20,30,60,0.98)",
          boxShadow: "0 8px 32px 0 #1976d244",
          backdropFilter: "blur(8px)",
        }}
      >
        <StudentHeader
          selectedStudent={selectedStudent}
          snapshotMetrics={snapshotMetrics}
          recommendationLabel={recommendationLabel}
          stagePhaseStatus={stagePhaseStatus}
          unlockedStage={unlockedStage}
          patternOnlyDay={patternOnlyDay}
        />

        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          pendingImportSummary={
            pendingImport
              ? {
                  fileName: pendingImport.fileName,
                  studentCount: pendingImport.payload.appState.students.length,
                  lessonCount: pendingImport.payload.lessons.length,
                  patternOnlyDay: pendingImport.payload.settings.patternOnlyDay,
                  recencyWindow: pendingImport.payload.settings.recencyWindow,
                }
              : null
          }
          importValidation={pendingImport?.validation ?? null}
          canConfirmImport={pendingImport ? !pendingImport.validation.hasCriticalIssues : false}
          onConfirmImport={handleConfirmImport}
          onCancelImport={handleCancelImport}
          canUndoImport={Boolean(lastImportSnapshot)}
          onUndoLastImport={handleUndoLastImport}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px, 260px) 1fr",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <StudentRoster
            students={students}
            selectedStudentId={selectedStudentId}
            onSelect={handleSelectStudent}
            onAdd={handleAddStudent}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {!selectedStudent ? (
              <div style={noticeCardStyle}>No student selected</div>
            ) : (
              <>
                <LessonEntryForm
                  key={selectedStudent.id}
                  recommended={recommendedManeuver}
                  maneuvers={maneuvers}
                  onSubmit={handleAddLesson}
                />

                {currentStatus ? (
                  <StageProgressPanel unlockedStage={unlockedStage} status={currentStatus} />
                ) : (
                  <div style={noticeCardStyle}>Log a lesson to see stage status.</div>
                )}

                <RecentLessonsPanel lessons={studentLessons} onDeleteLesson={handleDeleteLesson} />
                <WeakestManeuversPanel lessons={studentLessons} />
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {selectedStudent ? (
            <>
              <div style={{ marginBottom: 8, color: "#bfdbfe", fontSize: 13 }}>
                Selected Stage: {selectedStage}
              </div>

              {STAGES.map((stage) => {
                const locked = isStageLocked(stage.stageNumber);
                const isSelected = selectedStage === stage.stageNumber;
                const lockReason = stageLockReasons[stage.stageNumber] ?? "";

                return (
                  <div key={stage.stageNumber} style={{ marginBottom: 10 }}>
                    <button
                      type="button"
                      disabled={locked}
                      title={lockReason}
                      onClick={() => {
                        if (locked) return;
                        setSelectedStage(stage.stageNumber);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: isSelected ? "1px solid #93c5fd" : "1px solid #42a5f544",
                        background: locked ? "#1f2937" : isSelected ? "#1d4ed8" : "#1f3a66",
                        color: locked ? "#9ca3af" : "#dbeafe",
                        cursor: locked ? "not-allowed" : "pointer",
                        opacity: locked ? 0.75 : 1,
                      }}
                    >
                      Stage {stage.stageNumber}: {stage.title}
                      {locked ? <span style={lockedChipStyle}>Locked</span> : null}
                    </button>

                    {locked ? <div style={lockedReasonStyle}>{lockReason}</div> : null}
                  </div>
                );
              })}

              <div style={noticeCardStyle}>
                <p>
                  <strong>Next recommendation:</strong> {recommendationLabel}
                </p>
                <p>
                  <strong>Recommended maneuver:</strong> {recommendedManeuver?.name ?? "No recommendation yet"}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default App;
