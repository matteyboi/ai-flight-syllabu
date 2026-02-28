import { describe, expect, it } from "vitest";
import { createBackupJson, parseBackupJson } from "./backup";

describe("backup utils", () => {
  it("round-trips valid payload", () => {
    const json = createBackupJson({
      appState: { students: [], selectedStudentId: null },
      lessons: [],
      settings: { patternOnlyDay: false, recencyWindow: 30 },
    });

    const parsed = parseBackupJson(json);
    expect(parsed.version).toBe(1);
    expect(parsed.appState.selectedStudentId).toBeNull();
    expect(parsed.settings.recencyWindow).toBe(30);
  });

  it("throws on invalid json", () => {
    expect(() => parseBackupJson("not-json")).toThrow("Invalid JSON file.");
  });

  it("throws on unsupported version", () => {
    expect(() =>
      parseBackupJson(JSON.stringify({ version: 999 }))
    ).toThrow("Unsupported backup version.");
  });
});