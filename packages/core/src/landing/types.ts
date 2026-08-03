export type CapabilityStatus = "in-development" | "available" | "deprecated" | "removed";
export type CapabilityMaturity = "experimental" | "beta" | "stable";

export type CapabilityLifecycle =
  | { status: "in-development" }
  | { status: "available" | "deprecated"; maturity: CapabilityMaturity }
  | { status: "removed" };

export interface Evidence {
  type: "file-exists" | "cli-command" | "package-export";
  target: string;
}

export interface Capability {
  id: string;
  lifecycle: CapabilityLifecycle;
  evidence: Evidence[];
}

export interface VerifiedCapability extends Capability {
  verifiedAt: string;
}

export interface ProductState {
  capabilities: VerifiedCapability[];
  release: {
    version: string;
    stage: string;
  };
}
