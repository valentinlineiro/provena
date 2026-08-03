import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Capability, VerifiedCapability, ProductState } from "../../src/landing/types.js";
import "../../src/landing/types.js";

describe("Capability & ProductState types", () => {
  it("should construct a valid capability object", () => {
    const cap: Capability = {
      id: "continuous-capture",
      lifecycle: { status: "available", maturity: "experimental" },
      evidence: [{ type: "file-exists", target: "packages/cli/src/commands/add.ts" }]
    };
    assert.equal(cap.id, "continuous-capture");
    assert.equal(cap.lifecycle.status, "available");
  });
});
