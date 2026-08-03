import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runLandingReview, runLandingAccept } from "./landing.js";
import fs from "node:fs";
import path from "node:path";

describe("Landing CLI commands", () => {
  it("reviews current landing model without throwing", async () => {
    const result = await runLandingReview(process.cwd());
    assert.equal(typeof result.hasDiff, "boolean");
    assert.equal(result.model.identity.name, "Provena");
  });

  it("accepts landing model and writes website/landing-snapshot.json", async () => {
    const model = await runLandingAccept(process.cwd());
    assert.equal(model.identity.name, "Provena");
    const snapshotPath = path.resolve(process.cwd(), "website/landing-snapshot.json");
    assert.equal(fs.existsSync(snapshotPath), true);
    const content = fs.readFileSync(snapshotPath, "utf-8");
    const parsed = JSON.parse(content);
    assert.equal(parsed.identity.name, "Provena");
  });
});
