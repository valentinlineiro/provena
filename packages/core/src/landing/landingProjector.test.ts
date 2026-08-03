import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { landingProjector, LandingPolicy } from "./landingProjector.js";
import type { ProductState } from "./types.js";

describe("landingProjector", () => {
  const mockProduct: ProductState = {
    release: { version: "0.1.0", stage: "alpha" },
    capabilities: [
      {
        id: "continuous-capture",
        lifecycle: { status: "available", maturity: "experimental" },
        evidence: [],
        verifiedAt: "2026-08-03T12:00:00Z"
      },
      {
        id: "linkedin-bootstrap",
        lifecycle: { status: "available", maturity: "stable" },
        evidence: [],
        verifiedAt: "2026-08-03T12:00:00Z"
      },
      {
        id: "in-dev-feature",
        lifecycle: { status: "in-development" },
        evidence: [],
        verifiedAt: "2026-08-03T12:00:00Z"
      },
      {
        id: "removed-feature",
        lifecycle: { status: "removed" },
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
      },
      "linkedin-bootstrap": {
        presentation: "secondary",
        priority: 50,
        title: "Bootstrap from LinkedIn",
        summary: "Export profile zip."
      }
    }
  };

  it("projects verified capabilities into LandingModel sorted by priority", () => {
    const model = landingProjector(mockProduct, mockPolicy);
    assert.equal(model.identity.name, "Provena");
    assert.equal(model.sections.capabilities.length, 2);
    const [cap0, cap1] = model.sections.capabilities;
    assert.ok(cap0);
    assert.ok(cap1);
    assert.equal(cap0.title, "Capture as you work");
    assert.equal(cap0.presentation, "primary");
    assert.equal(cap0.maturity, "experimental");
    assert.equal(cap1.title, "Bootstrap from LinkedIn");
    assert.equal(cap1.presentation, "secondary");
    assert.equal(cap1.maturity, "stable");
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
    assert.throws(
      () => landingProjector(mockProduct, invalidPolicy),
      /unknown capability 'non-existent-cap'/
    );
  });

  it("throws invariant error if capability status is removed", () => {
    const invalidPolicy: LandingPolicy = {
      ...mockPolicy,
      capabilities: {
        "removed-feature": {
          presentation: "primary",
          priority: 10,
          title: "Removed",
          summary: "Removed feature"
        }
      }
    };
    assert.throws(
      () => landingProjector(mockProduct, invalidPolicy),
      /Cannot project removed capability 'removed-feature'/
    );
  });

  it("throws invariant error if capability status is in-development and presentation is not preview", () => {
    const invalidPolicy: LandingPolicy = {
      ...mockPolicy,
      capabilities: {
        "in-dev-feature": {
          presentation: "primary",
          priority: 10,
          title: "In Dev",
          summary: "In development"
        }
      }
    };
    assert.throws(
      () => landingProjector(mockProduct, invalidPolicy),
      /Capability 'in-dev-feature' is in-development and must have presentation 'preview'/
    );
  });

  it("allows in-development capability if presentation is preview", () => {
    const validPolicy: LandingPolicy = {
      ...mockPolicy,
      capabilities: {
        "in-dev-feature": {
          presentation: "preview",
          priority: 10,
          title: "In Dev",
          summary: "In development"
        }
      }
    };
    const model = landingProjector(mockProduct, validPolicy);
    assert.equal(model.sections.capabilities.length, 1);
    const [cap0] = model.sections.capabilities;
    assert.ok(cap0);
    assert.equal(cap0.presentation, "preview");
    assert.equal(cap0.maturity, undefined);
  });
});
