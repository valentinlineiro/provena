import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface SyntheticWorkspaceOptions {
  personName?: string;
  title?: string;
}

export async function createTestWorkspace(options: SyntheticWorkspaceOptions = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "provena-test-"));
  const personName = options.personName ?? "Test Person";
  const title = options.title ?? "Software Engineer";

  fs.writeFileSync(
    path.join(tmpDir, "person.yaml"),
    `name: "${personName}"\ntitle: "${title}"\nsummary: "Test summary"\nurls: {}\n`,
    "utf-8"
  );
  fs.writeFileSync(
    path.join(tmpDir, "experience.yaml"),
    `- id: "exp-1"\n  organization: "Test Org"\n  title: "${title}"\n  start: "2024-01"\n  summary: "Test exp"\n  achievements: []\n  technologies: []\n  capabilityIds: []\n  evidenceIds: []\n`,
    "utf-8"
  );
  fs.writeFileSync(
    path.join(tmpDir, "capabilities.yaml"),
    `- id: "cap-1"\n  name: "Testing"\n  description: "Writing unit tests"\n  evidenceIds: []\n`,
    "utf-8"
  );
  fs.writeFileSync(
    path.join(tmpDir, "provena.yaml"),
    `version: 1\nidentity:\n  person: person.yaml\n  experiences:\n    - experience.yaml\n  capabilities:\n    - capabilities.yaml\n`,
    "utf-8"
  );

  return {
    rootDir: tmpDir,
    cleanup: () => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  };
}
