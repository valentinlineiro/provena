# Declarative Landing Projections (`landingProjector`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a declarative landing projection pipeline that validates product capability claims against repository evidence, applies editorial policy, generates a structured `LandingModel`, and verifies changes against an accepted snapshot in CI.

**Architecture:** A standalone domain package/module (`packages/html` or dedicated module) that loads `product/capabilities/*.yaml`, resolves evidence using `EvidenceResolvers`, produces an in-memory `ProductState`, projects it via `landingProjector(product, policy)` to a `LandingModel`, and compares/renders it.

**Tech Stack:** TypeScript, Node.js (`fs`/`path`), Vitest / Node test runner, YAML parser (e.g. `yaml` package or existing monorepo YAML utilities).

## Global Constraints

- **Spec Document:** `docs/superpowers/specs/2026-08-03-landing-projection-design.md`
- **Pure Function Boundaries:** `landingProjector` has zero knowledge of HTML/VitePress/filesystem.
- **Authority Chain:** Manifests declare claims; Repository contains evidence authority; EvidenceResolvers verify claims; `ProductState` contains verified facts.
- **Zero Premature Abstraction:** Keep everything focused strictly on `landingProjector`. Do not create a generic `ProductProjection` or `@provena/product` package until a second projection exists.

---

### Task 1: Capability Manifest & Evidence Resolver Types + Initial Product Capabilities

**Files:**
- Create: `product/capabilities/linkedin-bootstrap.yaml`
- Create: `product/capabilities/continuous-capture.yaml`
- Create: `product/capabilities/cv-projection.yaml`
- Create: `packages/core/src/landing/types.ts`
- Test: `packages/core/test/landing/types.test.ts`

**Interfaces:**
- Produces: `Capability`, `VerifiedCapability`, `Evidence`, `ProductState`, `CapabilityStatus`, `CapabilityMaturity`

- [ ] **Step 1: Write the failing test for capability data structures**

```typescript
// packages/core/test/landing/types.test.ts
import { describe, it, expect } from "vitest";
import type { Capability, VerifiedCapability, ProductState } from "../../src/landing/types.js";

describe("Capability & ProductState types", () => {
  it("should construct a valid capability object", () => {
    const cap: Capability = {
      id: "continuous-capture",
      lifecycle: { status: "available", maturity: "experimental" },
      evidence: [{ type: "file-exists", target: "packages/cli/src/commands/add.ts" }]
    };
    expect(cap.id).toBe("continuous-capture");
    expect(cap.lifecycle.status).toBe("available");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test packages/core/test/landing/types.test.ts`
Expected: FAIL with "Cannot find module '../../src/landing/types.js'"

- [ ] **Step 3: Write types implementation and YAML files**

```typescript
// packages/core/src/landing/types.ts
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
```

```yaml
# product/capabilities/continuous-capture.yaml
id: continuous-capture
lifecycle:
  status: available
  maturity: experimental
evidence:
  - type: file-exists
    target: packages/cli/src/index.ts
```

```yaml
# product/capabilities/linkedin-bootstrap.yaml
id: linkedin-bootstrap
lifecycle:
  status: available
  maturity: beta
evidence:
  - type: file-exists
    target: packages/linkedin/src/index.ts
```

```yaml
# product/capabilities/cv-projection.yaml
id: cv-projection
lifecycle:
  status: available
  maturity: stable
evidence:
  - type: file-exists
    target: packages/html/src/index.ts
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test packages/core/test/landing/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add product/capabilities/ packages/core/src/landing/types.ts packages/core/test/landing/types.test.ts
git commit -m "feat(landing): define capability types and initial manifest files"
```

---

### Task 2: Evidence Resolvers & `buildProductState`

**Files:**
- Create: `packages/core/src/landing/evidenceResolver.ts`
- Create: `packages/core/src/landing/buildProductState.ts`
- Test: `packages/core/test/landing/buildProductState.test.ts`

**Interfaces:**
- Consumes: `Capability`, `Evidence`, `ProductState` from `types.ts`
- Produces: `buildProductState(rootDir: string, capabilities: Capability[]): Promise<ProductState>`

- [ ] **Step 1: Write the failing test for `buildProductState` and evidence resolution**

```typescript
// packages/core/test/landing/buildProductState.test.ts
import { describe, it, expect } from "vitest";
import { buildProductState } from "../../src/landing/buildProductState.js";
import type { Capability } from "../../src/landing/types.js";

describe("buildProductState", () => {
  it("resolves capabilities with existing evidence files", async () => {
    const caps: Capability[] = [
      {
        id: "cv-projection",
        lifecycle: { status: "available", maturity: "stable" },
        evidence: [{ type: "file-exists", target: "packages/core/src/index.ts" }]
      }
    ];

    const state = await buildProductState(process.cwd(), caps);
    expect(state.capabilities).toHaveLength(1);
    expect(state.capabilities[0].id).toBe("cv-projection");
  });

  it("throws error if evidence target file does not exist", async () => {
    const caps: Capability[] = [
      {
        id: "fake-cap",
        lifecycle: { status: "available", maturity: "stable" },
        evidence: [{ type: "file-exists", target: "non/existent/file.ts" }]
      }
    ];

    await expect(buildProductState(process.cwd(), caps)).rejects.toThrow(/Evidence file-exists failed/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test packages/core/test/landing/buildProductState.test.ts`
Expected: FAIL with "buildProductState is not defined"

- [ ] **Step 3: Write implementation for `evidenceResolver.ts` and `buildProductState.ts`**

```typescript
// packages/core/src/landing/evidenceResolver.ts
import fs from "node:fs";
import path from "node:path";
import type { Evidence } from "./types.js";

export function verifyEvidence(rootDir: string, evidence: Evidence): boolean {
  if (evidence.type === "file-exists") {
    const fullPath = path.resolve(rootDir, evidence.target);
    return fs.existsSync(fullPath);
  }
  return false;
}
```

```typescript
// packages/core/src/landing/buildProductState.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test packages/core/test/landing/buildProductState.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/landing/evidenceResolver.ts packages/core/src/landing/buildProductState.ts packages/core/test/landing/buildProductState.test.ts
git commit -m "feat(landing): implement evidence resolvers and buildProductState"
```

---

### Task 3: Landing Policy & `landingProjector`

**Files:**
- Create: `product/landing.yaml`
- Create: `packages/core/src/landing/landingProjector.ts`
- Test: `packages/core/test/landing/landingProjector.test.ts`

**Interfaces:**
- Consumes: `ProductState`, `LandingPolicy`
- Produces: `LandingModel`, `landingProjector(product: ProductState, policy: LandingPolicy): LandingModel`

- [ ] **Step 1: Write the failing test for `landingProjector`**

```typescript
// packages/core/test/landing/landingProjector.test.ts
import { describe, it, expect } from "vitest";
import { landingProjector, LandingPolicy, LandingModel } from "../../src/landing/landingProjector.js";
import type { ProductState } from "../../src/landing/types.js";

describe("landingProjector", () => {
  const mockProduct: ProductState = {
    release: { version: "0.1.0", stage: "alpha" },
    capabilities: [
      {
        id: "continuous-capture",
        lifecycle: { status: "available", maturity: "experimental" },
        evidence: [],
        verifiedAt: "2026-08-03T12:00:00Z"
      }
    ]
  };

  const mockPolicy: LandingPolicy = {
    identity: { name: "Provena", tagline: "Canonical Identity" },
    narrative: { problem: ["Fragmented history"], principles: ["local-first"] },
    capabilities: {
      "continuous-capture": {
        presentation: "primary",
        priority: 70,
        title: "Capture as you work",
        summary: "Capture evidence when it happens."
      }
    }
  };

  it("projects verified capabilities into LandingModel", () => {
    const model = landingProjector(mockProduct, mockPolicy);
    expect(model.identity.name).toBe("Provena");
    expect(model.sections.capabilities).toHaveLength(1);
    expect(model.sections.capabilities[0].title).toBe("Capture as you work");
    expect(model.sections.capabilities[0].presentation).toBe("primary");
  });

  it("throws invariant error if landing policy references an unknown capability", () => {
    const invalidPolicy: LandingPolicy = {
      ...mockPolicy,
      capabilities: {
        "non-existent-cap": {
          presentation: "primary",
          priority: 10,
          title: "Unknown",
          summary: "Unknown"
        }
      }
    };
    expect(() => landingProjector(mockProduct, invalidPolicy)).toThrow(/unknown capability 'non-existent-cap'/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test packages/core/test/landing/landingProjector.test.ts`
Expected: FAIL with "Cannot find module '../../src/landing/landingProjector.js'"

- [ ] **Step 3: Create `product/landing.yaml` and `landingProjector.ts` implementation**

```yaml
# product/landing.yaml
identity:
  name: Provena
  tagline: "Your professional identity, canonically yours."

narrative:
  problem:
    - "Your professional history is fragmented across platforms."
    - "LinkedIn is a platform, not your source of truth."
  principles:
    - local-first
    - provenance-aware
    - selective-projections

capabilities:
  continuous-capture:
    presentation: primary
    priority: 70
    title: "Capture as you work"
    summary: "Capture professional evidence when it happens, without restructuring your profile."

  linkedin-bootstrap:
    presentation: secondary
    priority: 50
    title: "Bootstrap from LinkedIn"
    summary: "Export your profile zip and seed your canonical history in seconds."

  cv-projection:
    presentation: primary
    priority: 80
    title: "Targeted CV Projections"
    summary: "Select relevant signals based on context and budget."
```

```typescript
// packages/core/src/landing/landingProjector.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test packages/core/test/landing/landingProjector.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add product/landing.yaml packages/core/src/landing/landingProjector.ts packages/core/test/landing/landingProjector.test.ts
git commit -m "feat(landing): implement LandingPolicy and pure landingProjector"
```

---

### Task 4: CLI Command (`provena landing review` & `provena landing accept`) & CI Invariant Verification

**Files:**
- Create: `packages/cli/src/commands/landing.ts`
- Create: `website/landing-snapshot.json`
- Test: `packages/cli/test/landingCommand.test.ts`

**Interfaces:**
- CLI command runner for `provena landing review` (prints diff vs snapshot) and `provena landing accept` (writes current `LandingModel` to `website/landing-snapshot.json`).

- [ ] **Step 1: Write the failing test for `provena landing review` and `accept` logic**

```typescript
// packages/cli/test/landingCommand.test.ts
import { describe, it, expect } from "vitest";
import { runLandingReview, runLandingAccept } from "../src/commands/landing.js";
import fs from "node:fs";
import path from "node:path";

describe("Landing CLI commands", () => {
  it("reviews current landing model without throwing", async () => {
    const result = await runLandingReview(process.cwd());
    expect(result.hasDiff).toBeDefined();
    expect(result.model.identity.name).toBe("Provena");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test packages/cli/test/landingCommand.test.ts`
Expected: FAIL with "runLandingReview is not defined"

- [ ] **Step 3: Write implementation for `packages/cli/src/commands/landing.ts` and create initial snapshot**

```typescript
// packages/cli/src/commands/landing.ts
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { buildProductState } from "@provena/core/landing/buildProductState";
import { landingProjector, LandingPolicy, LandingModel } from "@provena/core/landing/landingProjector";
import type { Capability } from "@provena/core/landing/types";

export function loadCapabilities(rootDir: string): Capability[] {
  const capsDir = path.resolve(rootDir, "product/capabilities");
  if (!fs.existsSync(capsDir)) return [];

  const files = fs.readdirSync(capsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(capsDir, file), "utf-8");
    return yaml.parse(content) as Capability;
  });
}

export function loadLandingPolicy(rootDir: string): LandingPolicy {
  const policyPath = path.resolve(rootDir, "product/landing.yaml");
  const content = fs.readFileSync(policyPath, "utf-8");
  return yaml.parse(content) as LandingPolicy;
}

export async function generateLandingModel(rootDir: string): Promise<LandingModel> {
  const caps = loadCapabilities(rootDir);
  const productState = await buildProductState(rootDir, caps);
  const policy = loadLandingPolicy(rootDir);
  return landingProjector(productState, policy);
}

export async function runLandingReview(rootDir: string) {
  const model = await generateLandingModel(rootDir);
  const snapshotPath = path.resolve(rootDir, "website/landing-snapshot.json");

  let snapshotContent = "";
  if (fs.existsSync(snapshotPath)) {
    snapshotContent = fs.readFileSync(snapshotPath, "utf-8");
  }

  const currentJson = JSON.stringify(model, null, 2);
  const hasDiff = snapshotContent.trim() !== currentJson.trim();

  return { model, hasDiff };
}

export async function runLandingAccept(rootDir: string) {
  const model = await generateLandingModel(rootDir);
  const snapshotPath = path.resolve(rootDir, "website/landing-snapshot.json");
  fs.writeFileSync(snapshotPath, JSON.stringify(model, null, 2) + "\n", "utf-8");
  return model;
}
```

- [ ] **Step 4: Run test and generate initial snapshot**

Run: `npm test packages/cli/test/landingCommand.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/landing.ts packages/cli/test/landingCommand.test.ts website/landing-snapshot.json
git commit -m "feat(cli): add provena landing review and provena landing accept commands"
```

---

## Self-Review Checklist

1. **Spec coverage:** 
   - Manifests & authority chain -> Task 1 & 2
   - Evidence resolution -> Task 2
   - `status` & `maturity` lifecycle -> Task 1 & 3
   - `landingProjector` pure function -> Task 3
   - L1/L2/L3 CI review & accept workflow -> Task 4
2. **Placeholder scan:** None found.
3. **Type consistency:** Types (`Capability`, `ProductState`, `LandingPolicy`, `LandingModel`) match across all tasks.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-03-landing-projection.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach would you like to take?
