export interface MapUser {
  id: string;
  role: string; // 'ADMIN' | 'CLOSER' | 'SETTER' | 'SETTER_JR' | 'TRAINEE'
  closerId?: number | null;
}

export interface MapVisit {
  id: number;
  stage: string;
  outcome?: string;
  closerId?: number | null;
  setterId?: number | null;
  createdAt?: string;
  legacyNotes?: string;
  setter?: { id: number; name: string; role?: string };
  closer?: { id: number; name: string };
  projects?: { projectType: { name: string } }[];
}

export interface MapParcel {
  id: string;
  externalId?: string;
  address: string;
  ownerName?: string;
  status: "AVAILABLE" | "LEAD" | "CUSTOMER";
  metadata?: string;
  geometry?: string;
  parcelTags?: string;
  parcelNotes?: string;
  setter?: { id: number; name: string; role?: string };
  visits?: MapVisit[];
}

export interface LeadPermissions {
  canEditNotes: boolean;
  canChangeTags: boolean;
  canCreateLead: boolean;
  canViewDetails: boolean;
  blockedReason: string | null;
}
