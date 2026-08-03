import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildProductState } from "./buildProductState.js";
import type { Capability } from "./types.js";

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
    assert.equal(state.capabilities.length, 1);
    assert.equal(state.capabilities[0]?.id, "cv-projection");
  });

  it("throws error if evidence target file does not exist", async () => {
    const caps: Capability[] = [
      {
        id: "fake-cap",
        lifecycle: { status: "available", maturity: "stable" },
        evidence: [{ type: "file-exists", target: "non/existent/file.ts" }]
      }
    ];

    await assert.rejects(
      async () => buildProductState(process.cwd(), caps),
      /Evidence file-exists failed/
    );
  });
});
