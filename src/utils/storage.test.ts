import { beforeEach, describe, expect, it } from "vitest";
import {
  loadAppState,
  loadLessons,
  saveAppState,
  saveLessons,
  type PersistedAppState,
} from "./storage";

import { loadSettings, saveSettings } from "./storage";

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: createStorageMock(),
    configurable: true,
  });
});

describe("storage", () => {
  it("loads legacy app state", () => {
    const legacy = { students: [{ id: "s1", name: "A" }], selectedStudentId: "s1" };
    localStorage.setItem("afs_app_state_v4", JSON.stringify(legacy));

    const out = loadAppState();
    expect(out.selectedStudentId).toBe("s1");
    expect(out.students.length).toBe(1);
  });

  it("migrates legacy lessons by adding patternOnlyDay=false", () => {
    localStorage.setItem(
      "afs_lessons_v4",
      JSON.stringify([
        {
          id: "l1",
          studentId: "s1",
          dateISO: "2026-01-01T00:00:00.000Z",
          status: "dual",
          notes: "",
          maneuverScores: [{ maneuverId: "pattern-ops", score: 3 }],
        },
      ])
    );

    const lessons = loadLessons();
    expect(lessons.length).toBe(1);
    expect(lessons[0].patternOnlyDay).toBe(false);
  });

  it("returns default settings when none are stored", () => {
    expect(loadSettings()).toEqual({ patternOnlyDay: false, recencyWindow: 30 });
  });

  it("round-trips settings", () => {
    const input = { patternOnlyDay: true, recencyWindow: 14 };
    saveSettings(input);
    expect(loadSettings()).toEqual(input);
  });

  it("round-trips current versioned app+lesson storage", () => {
    const app: PersistedAppState = { students: [], selectedStudentId: null };
    saveAppState(app);
    saveLessons([]);

    expect(loadAppState()).toEqual(app);
    expect(loadLessons()).toEqual([]);
  });
});