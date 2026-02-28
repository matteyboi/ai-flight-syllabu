import { createBackupJson, parseAndValidateBackupJson, parseBackupJson, validateBackupPayload } from "./backup";
import type { AppSettings } from "../models/settings";
import { describe, expect, it } from "vitest";

describe("backup utils", () => {
  const settings: AppSettings = { patternOnlyDay: false, recencyWindow: 30 };

  const basePayload = {
    appState: { students: [{ id: "s1" }] },
    lessons: [{ id: "l1", studentId: "s1" }],
    settings,
  };

  it("creates and parses a valid backup", () => {
    const raw = createBackupJson(basePayload as any);
    const parsed = parseBackupJson(raw);

    expect(parsed.version).toBe(1);
    expect(parsed.appState.students).toHaveLength(1);
    expect(parsed.lessons).toHaveLength(1);
    expect(parsed.settings.recencyWindow).toBe(30);
  });

  it("throws on unsupported version", () => {
    const raw = JSON.stringify({
      version: 99,
      exportedAtISO: new Date().toISOString(),
      ...basePayload,
    });

    expect(() => parseBackupJson(raw)).toThrow("Unsupported backup version.");
  });

  it("throws on invalid settings shape", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: basePayload.appState,
      lessons: basePayload.lessons,
      settings: { patternOnlyDay: "nope", recencyWindow: -5 },
    });

    expect(() => parseBackupJson(raw)).toThrow("Invalid or missing settings.");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseBackupJson("{ nope")).toThrow();
  });

  it("throws when backup root is not an object", () => {
    expect(() => parseBackupJson(JSON.stringify([]))).toThrow();
  });

  it("throws when appState is missing/invalid", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      lessons: basePayload.lessons,
      settings,
    });

    expect(() => parseBackupJson(raw)).toThrow();
  });

  it("normalizes invalid exportedAtISO to a valid ISO string", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: "not-a-date",
      appState: basePayload.appState,
      lessons: basePayload.lessons,
      settings,
    });

    const parsed = parseBackupJson(raw);
    expect(() => new Date(parsed.exportedAtISO).toISOString()).not.toThrow();
  });

  it("keeps exportedAtISO when it is already valid ISO", () => {
    const iso = "2026-02-28T12:00:00.000Z";
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: iso,
      appState: basePayload.appState,
      lessons: basePayload.lessons,
      settings,
    });

    const parsed = parseBackupJson(raw);
    expect(parsed.exportedAtISO).toBe(iso);
  });

  it("rejects settings with missing required key", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: basePayload.appState,
      lessons: basePayload.lessons,
      settings: { patternOnlyDay: true }, // recencyWindow missing
    });

    expect(() => parseBackupJson(raw)).toThrow("Invalid or missing settings.");
  });

  it("rejects settings with extra keys", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: basePayload.appState,
      lessons: basePayload.lessons,
      settings: { patternOnlyDay: true, recencyWindow: 30, extra: 1 },
    });

    expect(() => parseBackupJson(raw)).toThrow("Invalid or missing settings.");
  });

  it("rejects settings with non-finite recencyWindow", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: basePayload.appState,
      lessons: basePayload.lessons,
      settings: { patternOnlyDay: true, recencyWindow: Number.POSITIVE_INFINITY },
    });

    expect(() => parseBackupJson(raw)).toThrow("Invalid or missing settings.");
  });

  it("reports clean payload with no critical issues", () => {
    const report = validateBackupPayload({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: { students: [{ id: "s1" }, { id: "s2" }] } as any,
      lessons: [
        { id: "l1", studentId: "s1" } as any,
        { id: "l2", studentId: "s2" } as any,
      ],
      settings,
    });

    expect(report.invalidStudents).toBe(0);
    expect(report.invalidLessons).toBe(0);
    expect(report.duplicateStudentIds).toBe(0);
    expect(report.duplicateLessonIds).toBe(0);
    expect(report.unknownStudentRefs).toBe(0);
    expect(report.hasCriticalIssues).toBe(false);
  });

  it("reports duplicate and unknown references", () => {
    const report = validateBackupPayload({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: { students: [{ id: "s1" }, { id: "s1" }] } as any,
      lessons: [
        { id: "l1", studentId: "s1" } as any,
        { id: "l1", studentId: "missing" } as any,
      ],
      settings,
    });

    expect(report.duplicateStudentIds).toBe(1);
    expect(report.duplicateLessonIds).toBe(1);
    expect(report.unknownStudentRefs).toBe(1);
    expect(report.hasCriticalIssues).toBe(true);
  });

  it("parseAndValidateBackupJson returns payload+report for valid backup", () => {
    const raw = createBackupJson(basePayload as any);
    const result = parseAndValidateBackupJson(raw);

    expect(result.payload.version).toBe(1);
    expect(result.report.hasCriticalIssues).toBe(false);
  });

  it("parseAndValidateBackupJson throws on critical validation issues by default", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: { students: [{ id: "s1" }, { id: "s1" }] },
      lessons: [{ id: "l1", studentId: "missing" }],
      settings,
    });

    expect(() => parseAndValidateBackupJson(raw)).toThrow("Backup failed validation.");
  });

  it("parseAndValidateBackupJson can allow critical issues", () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAtISO: new Date().toISOString(),
      appState: { students: [{ id: "s1" }, { id: "s1" }] },
      lessons: [{ id: "l1", studentId: "missing" }],
      settings,
    });

    const result = parseAndValidateBackupJson(raw, { rejectOnCritical: false });
    expect(result.report.hasCriticalIssues).toBe(true);
  });
});