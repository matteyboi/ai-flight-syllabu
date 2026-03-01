import type { LessonEntry } from "../models/lesson";
import { evaluateSoloEligibility } from "../engine/soloEligibility";

type Props = {
  lessons: LessonEntry[];
  medical: boolean;
  tsaA14: boolean;

  soloEndorsementGiven: boolean;
  soloEndorsementDateISO: string | null;

  firstSoloCompleted: boolean;
  firstSoloDateISO: string | null;
  onMarkFirstSoloCompleted: () => void;
  onUnmarkFirstSoloCompleted: () => void;

  totalHours: number;
  minSoloHours: number;
};

export function SoloGatePanel({
  lessons,
  medical,
  tsaA14,
  soloEndorsementGiven,
  soloEndorsementDateISO,
  firstSoloCompleted,
  firstSoloDateISO,
  onMarkFirstSoloCompleted,
  onUnmarkFirstSoloCompleted,
  totalHours,
  minSoloHours,
}: Props) {
  const result = evaluateSoloEligibility({
    lessons,
    totalHours,
    minSoloHours,
    medical,
    tsaA14,
  });

  const passColor = "#0a7a2f";
  const failColor = "#b00020";

  const canMarkFirstSolo =
    result.ready && soloEndorsementGiven && !firstSoloCompleted;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: "2px solid #111",
        borderRadius: 12,
        background: "#fff",
        color: "#111",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Solo Eligibility</h2>

      <div
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #ddd",
          background: result.ready ? "#f3fff6" : "#fff6f7",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16 }}>{result.summary}</div>
        <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
          Rule-based compliance check (not AI). Instructor always has final
          authority.
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {result.checks.map((c) => (
          <div
            key={c.id}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fafafa",
              display: "grid",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900 }}>{c.label}</div>
              <div
                style={{
                  fontWeight: 900,
                  color: c.pass ? passColor : failColor,
                }}
              >
                {c.pass ? "PASS" : "FAIL"}
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{c.detail}</div>
          </div>
        ))}
      </div>

      {/* Endorsement */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          border: "1px solid #ddd",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          Instructor Endorsement
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          Solo endorsement given: <b>{soloEndorsementGiven ? "Yes" : "No"}</b>
          {soloEndorsementGiven && soloEndorsementDateISO ? (
            <>
              {" "}
              • Date:{" "}
              <b>{new Date(soloEndorsementDateISO).toLocaleDateString()}</b>
            </>
          ) : null}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
          (Checkbox lives in Student Profile.)
        </div>
      </div>

      {/* First Solo milestone */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          border: "1px solid #ddd",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          First Solo (Pattern)
        </div>

        <div style={{ fontSize: 13, opacity: 0.9 }}>
          Completed: <b>{firstSoloCompleted ? "Yes" : "No"}</b>
          {firstSoloCompleted && firstSoloDateISO ? (
            <>
              {" "}
              • Date: <b>{new Date(firstSoloDateISO).toLocaleDateString()}</b>
            </>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {!firstSoloCompleted ? (
            <button
              onClick={onMarkFirstSoloCompleted}
              disabled={!canMarkFirstSolo}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "2px solid #111",
                fontWeight: 900,
                cursor: canMarkFirstSolo ? "pointer" : "not-allowed",
                background: canMarkFirstSolo ? "#fff" : "#f2f2f2",
                color: "#111",
              }}
              title={
                canMarkFirstSolo
                  ? "Mark First Solo Completed"
                  : "Requires: Solo READY + Endorsement given"
              }
            >
              Mark First Solo Completed
            </button>
          ) : (
            <button
              onClick={onUnmarkFirstSoloCompleted}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "2px solid #111",
                fontWeight: 900,
                cursor: "pointer",
                background: "#fff",
                color: "#111",
              }}
            >
              Unmark First Solo
            </button>
          )}
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          Stage 4 unlock now requires First Solo completion (more realistic than
          endorsement alone).
        </div>
      </div>
    </div>
  );
}
