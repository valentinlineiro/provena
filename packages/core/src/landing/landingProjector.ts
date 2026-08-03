import type { ProductState } from "./types.js";

export type LandingPresentation = "primary" | "secondary" | "preview";

export interface LandingCapabilityPolicy {
  presentation: LandingPresentation;
  priority: number;
  title: string;
  summary: string;
}

export interface LandingPolicy {
  identity: {
    name: string;
    tagline: string;
  };
  narrative: {
    problem: string[];
    principles: string[];
  };
  capabilities: Record<string, LandingCapabilityPolicy>;
}

export interface ProjectedCapabilityItem {
  id: string;
  title: string;
  summary: string;
  presentation: LandingPresentation;
  priority: number;
  status: string;
  maturity?: string;
}

export interface LandingModel {
  identity: {
    name: string;
    tagline: string;
  };
  narrative: {
    problem: string[];
    principles: string[];
  };
  sections: {
    capabilities: ProjectedCapabilityItem[];
  };
}

export function landingProjector(
  product: ProductState,
  policy: LandingPolicy
): LandingModel {
  const verifiedMap = new Map(product.capabilities.map((c) => [c.id, c]));
  const projectedCapabilities: ProjectedCapabilityItem[] = [];

  for (const [id, itemPolicy] of Object.entries(policy.capabilities)) {
    const verified = verifiedMap.get(id);
    if (!verified) {
      throw new Error(`Landing policy references unknown capability '${id}'`);
    }

    if (verified.lifecycle.status === "removed") {
      throw new Error(`Cannot project removed capability '${id}'`);
    }

    if (
      verified.lifecycle.status === "in-development" &&
      itemPolicy.presentation !== "preview"
    ) {
      throw new Error(
        `Capability '${id}' is in-development and must have presentation 'preview'`
      );
    }

    projectedCapabilities.push({
      id,
      title: itemPolicy.title,
      summary: itemPolicy.summary,
      presentation: itemPolicy.presentation,
      priority: itemPolicy.priority,
      status: verified.lifecycle.status,
      maturity: "maturity" in verified.lifecycle ? verified.lifecycle.maturity : undefined
    });
  }

  projectedCapabilities.sort((a, b) => b.priority - a.priority);

  return {
    identity: policy.identity,
    narrative: policy.narrative,
    sections: {
      capabilities: projectedCapabilities
    }
  };
}
