export type SoloStatus = "pre-solo" | "solo" | "post-solo";

export type StudentChecklist = {
  tsaA14: boolean;
  iacra: boolean;
  medical: boolean;
  writtenTestPassed: boolean;
};

export type StudentEndorsements = {
  soloEndorsementGiven: boolean;
  soloEndorsementDateISO: string | null; // ISO string
};

export type StudentMilestones = {
  firstSoloCompleted: boolean;
  firstSoloDateISO: string | null;
};

export type LicenseType = "private" | "instrument" | "commercial" | "cfi";

export interface Student {
  id: string;
  name: string;
  license: LicenseType;
  soloStatus: "pre-solo" | "solo-ready" | "soloed";
  checklist: {
    tsaA14: boolean;
    iacra: boolean;
    medical: boolean;
    writtenTestPassed: boolean;
  };
  endorsements: {
    soloEndorsementGiven: boolean;
    soloEndorsementDateISO: string | null;
  };
  milestones: {
    firstSoloCompleted: boolean;
    firstSoloDateISO: string | null;
  };
  createdAtISO: string;
  updatedAtISO: string;
}
