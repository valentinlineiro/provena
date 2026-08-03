import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { buildProductState } from "@provena/core/landing/buildProductState.js";
import { landingProjector, type LandingPolicy, type LandingModel } from "@provena/core/landing/landingProjector.js";
import type { Capability } from "@provena/core/landing/types.js";

export function loadCapabilities(rootDir: string): Capability[] {
  const capsDir = path.resolve(rootDir, "product/capabilities");
  if (!fs.existsSync(capsDir)) return [];

  const files = fs.readdirSync(capsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(capsDir, file), "utf-8");
    return yaml.load(content) as Capability;
  });
}

export function loadLandingPolicy(rootDir: string): LandingPolicy {
  const policyPath = path.resolve(rootDir, "product/landing.yaml");
  const content = fs.readFileSync(policyPath, "utf-8");
  return yaml.load(content) as LandingPolicy;
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
  const dir = path.dirname(snapshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(snapshotPath, JSON.stringify(model, null, 2) + "\n", "utf-8");
  return model;
}
