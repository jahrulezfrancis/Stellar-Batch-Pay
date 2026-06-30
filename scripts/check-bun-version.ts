import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function run() {
  try {
    const pkgPath = join(ROOT, "package.json");
    const pkgContent = JSON.parse(readFileSync(pkgPath, "utf8"));
    const packageManager = pkgContent.packageManager;

    if (!packageManager || !packageManager.startsWith("bun@")) {
      console.error("check-bun-version: packageManager field in package.json is missing or does not start with 'bun@'");
      process.exit(1);
    }

    const expectedVersion = packageManager.split("@")[1];
    const actualVersion = process.versions.bun;

    if (!actualVersion) {
      console.error("check-bun-version: Not running under Bun! Please execute with bun.");
      process.exit(1);
    }

    if (actualVersion !== expectedVersion) {
      console.error(`check-bun-version: Bun version mismatch! Expected ${expectedVersion}, but running with ${actualVersion}`);
      process.exit(1);
    }

    console.log(`check-bun-version: OK (Bun version ${actualVersion} matches package.json)`);
    process.exit(0);
  } catch (err) {
    console.error("check-bun-version: Failed to verify Bun version:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

run();
