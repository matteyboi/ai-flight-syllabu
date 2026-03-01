import React from "react";
import type { Student } from "../models/student";

type Props = {
  student: Student;
};

export const StudentProfile: React.FC<Props> = ({ student }) => (
  <div
    style={{
      background: "#162447",
      borderRadius: 12,
      padding: 12,
      boxShadow: "0 2px 8px #1976d244",
      marginBottom: 0,
    }}
  >
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
      Student Profile
    </h2>
    <div
      style={{ marginTop: 6, fontWeight: 700, color: "#e3f2fd", fontSize: 14 }}
    >
      Name: <span style={{ fontWeight: 400 }}>{student.name}</span>
    </div>
    <div style={{ marginTop: 4, color: "#e3f2fd", fontSize: 14 }}>
      Solo Status: <b>{student.soloStatus}</b>
    </div>
  </div>
);
