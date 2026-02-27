import { useState } from "react";
import type { Student, LicenseType } from "../models/student";

type StudentRosterProps = {
  students: Student[];
  selectedStudentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (name: string, license: LicenseType) => void;
  onEdit?: (id: string, name: string, license: LicenseType) => void;
};

export function StudentRoster({
  students,
  selectedStudentId,
  onSelect,
  onDelete,
  onAdd,
  onEdit,
}: StudentRosterProps) {
  const DEFAULT_LICENSE = "Private Pilot" as LicenseType;

  const [newName, setNewName] = useState("");
  const [newLicense, setNewLicense] = useState<LicenseType>(DEFAULT_LICENSE);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLicense, setEditLicense] = useState<LicenseType>(DEFAULT_LICENSE);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    onAdd(trimmed, newLicense);
    setNewName("");
    setNewLicense(DEFAULT_LICENSE);
  };

  const beginEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditLicense(student.license);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditLicense(DEFAULT_LICENSE);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    onEdit?.(editingId, trimmed, editLicense);
    cancelEdit();
  };

  return (
    <div
      style={{
        background: "#162447",
        borderRadius: 12,
        padding: 12,
        marginTop: 0,
        boxShadow: "0 2px 8px #1976d244",
        minHeight: 320,
        maxHeight: 540,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 16,
            background: "linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Students
        </h2>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0 0" }}>
        {students.map((student) => {
          const isSelected = student.id === selectedStudentId;
          const isEditing = student.id === editingId;

          return (
            <li
              key={student.id}
              style={{
                background: isSelected ? "linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)" : "#1b2a4a",
                color: isSelected ? "#fff" : "#e3f2fd",
                borderRadius: 7,
                padding: "8px 10px",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: isEditing ? "default" : "pointer",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: isSelected ? "0 0 6px #42a5f544" : undefined,
                border: isSelected ? "2px solid #1976d2" : "2px solid transparent",
                gap: 10,
              }}
              onClick={() => !isEditing && onSelect(student.id)}
            >
              {isEditing ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={editName}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #90caf9",
                      background: "#0a192f",
                      color: "#e3f2fd",
                      fontSize: 13,
                    }}
                  />
                  <select
                    value={editLicense}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditLicense(e.target.value as LicenseType)}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #90caf9",
                      background: "#0a192f",
                      color: "#e3f2fd",
                      fontSize: 13,
                    }}
                  >
                    <option>Private Pilot</option>
                    <option>Instrument Rating</option>
                    <option>Commercial Pilot</option>
                  </select>
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14 }}
                  >
                    {student.name}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      fontWeight: 500,
                      opacity: 0.9,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {student.license}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdit();
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#b9f6ca",
                        fontWeight: 900,
                        fontSize: 14,
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Save"
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ffccbc",
                        fontWeight: 900,
                        fontSize: 14,
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Cancel"
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        beginEdit(student);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isSelected ? "#fff" : "#90caf9",
                        fontWeight: 900,
                        fontSize: 14,
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Edit student"
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(student.id);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isSelected ? "#fff" : "#42a5f5",
                        fontWeight: 900,
                        fontSize: 16,
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Delete student"
                      type="button"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div
        style={{
          marginTop: 16,
          background: "#1b2a4a",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px #1976d222",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <label
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: "#42a5f5",
            marginBottom: 6,
            letterSpacing: "-0.5px",
          }}
        >
          Name
        </label>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter student name"
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #1976d2",
            background: "#0a192f",
            color: "#e3f2fd",
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 12,
            boxShadow: "0 1px 4px #1976d222",
          }}
        />

        <label
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "#90caf9",
            marginBottom: 6,
            letterSpacing: "-0.5px",
          }}
        >
          License
        </label>
        <select
          value={newLicense}
          onChange={(e) => setNewLicense(e.target.value as LicenseType)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #1976d2",
            background: "#0a192f",
            color: "#e3f2fd",
            fontWeight: 500,
            fontSize: 15,
            marginBottom: 12,
            boxShadow: "0 1px 4px #1976d222",
          }}
        >
          <option>Private Pilot</option>
          <option>Instrument Rating</option>
          <option>Commercial Pilot</option>
        </select>

        <button
          onClick={handleAdd}
          style={{
            alignSelf: "center",
            width: 140,
            padding: "8px 0",
            borderRadius: 8,
            border: "none",
            background: "#42a5f5",
            color: "#162447",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 2px 8px #42a5f533",
          }}
          type="button"
        >
          Add Student
        </button>
      </div>
    </div>
  );
}