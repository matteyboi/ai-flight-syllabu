export type AppSettings = {
  patternOnlyDay: boolean;
  recencyWindow: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  patternOnlyDay: false,
  recencyWindow: 30,
};

export type SchoolSettings = {
  minSoloHours: number; // e.g., 10.0
};