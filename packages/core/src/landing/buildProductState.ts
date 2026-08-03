import { verifyEvidence } from "./evidenceResolver.js";
import type { Capability, ProductState, VerifiedCapability } from "./types.js";

export async function buildProductState(
  rootDir: string,
  capabilities: Capability[]
): Promise<ProductState> {
  const verified: VerifiedCapability[] = [];

  for (const cap of capabilities) {
    for (const ev of cap.evidence) {
      const ok = verifyEvidence(rootDir, ev);
      if (!ok) {
        throw new Error(`Evidence ${ev.type} failed for capability '${cap.id}': target '${ev.target}' not found`);
      }
    }
    verified.push({
      ...cap,
      verifiedAt: new Date().toISOString()
    });
  }

  return {
    capabilities: verified,
    release: {
      version: "0.1.0",
      stage: "adoption-experiment"
    }
  };
}
