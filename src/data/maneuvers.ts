import type { Maneuver } from "../models/lesson";

export const MANEUVERS: Maneuver[] = [
  // Stage 1 — Aircraft Control (fundamentals)
  {
    id: "preflight",
    name: "Preflight Inspection",
    stage: 1,
    isSafetyCritical: true,
  },
  { id: "taxi", name: "Taxi & Run-up", stage: 1, isSafetyCritical: true },
  {
    id: "straight-level",
    name: "Straight-and-Level Flight",
    stage: 1,
    isSafetyCritical: false,
  },
  {
    id: "climbs-descents",
    name: "Climbs & Descents",
    stage: 1,
    isSafetyCritical: false,
  },
  {
    id: "turns",
    name: "Turns (Shallow/Medium)",
    stage: 1,
    isSafetyCritical: false,
  },
  { id: "slow-flight", name: "Slow Flight", stage: 1, isSafetyCritical: true },
  {
    id: "stalls",
    name: "Power-On/Power-Off Stalls",
    stage: 1,
    isSafetyCritical: true,
  },
  {
    id: "emergencies",
    name: "Emergency Procedures (Simulated)",
    stage: 1,
    isSafetyCritical: true,
  },

  // Stage 2 — Pattern Mastery
  {
    id: "pattern-ops",
    name: "Traffic Pattern Operations",
    stage: 2,
    isSafetyCritical: true,
  },
  {
    id: "normal-takeoff",
    name: "Normal Takeoff",
    stage: 2,
    isSafetyCritical: true,
  },
  {
    id: "normal-landing",
    name: "Normal Landing",
    stage: 2,
    isSafetyCritical: true,
  },
  {
    id: "go-around",
    name: "Go-Around / Rejected Landing",
    stage: 2,
    isSafetyCritical: true,
  },

  // Stage 3 — Solo (gate-controlled; not “maneuvers” per se, but milestones)
  {
    id: "solo-pattern",
    name: "First Solo (Pattern)",
    stage: 3,
    isSafetyCritical: true,
  },

  // Stage 4 — Maneuver Development
  { id: "steep-turns", name: "Steep Turns", stage: 4, isSafetyCritical: false },
  {
    id: "ground-ref",
    name: "Ground Reference Maneuvers",
    stage: 4,
    isSafetyCritical: false,
  },

  // Stage 5 — Performance Ops
  {
    id: "short-field",
    name: "Short-Field Takeoff & Landing",
    stage: 5,
    isSafetyCritical: true,
  },
  {
    id: "soft-field",
    name: "Soft-Field Takeoff & Landing",
    stage: 5,
    isSafetyCritical: true,
  },

  // Stage 6 — Cross Country
  {
    id: "pilotage",
    name: "Pilotage & Dead Reckoning",
    stage: 6,
    isSafetyCritical: false,
  },
  {
    id: "xc-planning",
    name: "Cross-Country Planning",
    stage: 6,
    isSafetyCritical: true,
  },
  {
    id: "xc-flight",
    name: "Dual Cross-Country Flight",
    stage: 6,
    isSafetyCritical: true,
  },

  // Stage 7 — Checkride Prep
  {
    id: "acs-review",
    name: "ACS Review / Mock Checkride",
    stage: 7,
    isSafetyCritical: true,
  },
];
export const TRAINING_ORDER: string[] = [
  // Stage 1 – Aircraft Control
  "preflight",
  "taxi",
  "straight-level",
  "climbs-descents",
  "turns",
  "slow-flight",
  "stalls",
  "emergencies",

  // Stage 2 – Pattern
  "pattern-ops",
  "normal-takeoff",
  "normal-landing",
  "go-around",

  // Stage 3+ will come later
];
