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
