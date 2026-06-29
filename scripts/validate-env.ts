import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const ROOT = process.cwd();
let failed = false;

function fail(message: string): void {
  console.error(`FAIL: ${message}`);
  failed = true;
}

function ok(message: string): void {
  console.log(`OK: ${message}`);
}

function warn(message: string): void {
  console.warn(`WARN: ${message}`);
}

const examplePath = `${ROOT}/.env.example`;

if (!existsSync(examplePath)) {
  fail(".env.example is missing");
} else {
  const content = readFileSync(examplePath, "utf8");
  ok(".env.example exists");

  const requiredSections = [
    "Wallet/Signing",
    "Storage",
    "Rate limits",
    "Horizon/RPC",
    "Webhooks",
    "Keeper",
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      fail(`.env.example is missing section: ${section}`);
    } else {
      ok(`.env.example contains section: ${section}`);
    }
  }

  if (/STELLAR_SECRET_KEY\s*=\s*S[A-Z2-7]{55}/.test(content)) {
    fail(".env.example contains a value that looks like a real secret key");
  }

  if (/ALLOW_SERVER_SIGNING\s*=\s*true/.test(content)) {
    fail(".env.example sets ALLOW_SERVER_SIGNING=true without a strong warning");
  }
}

try {
  const tracked = execSync("git ls-files .env .env.local .env.production .env*.local", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  if (tracked) {
    fail(`tracked env files: ${tracked}`);
  } else {
    ok("no sensitive .env files tracked by git");
  }
} catch {
  ok("no sensitive .env files tracked by git");
}

try {
  const untracked = execSync("git ls-files --others --exclude-standard .env .env.local .env.production .env*.local", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  if (untracked) {
    warn(`untracked env files present (should not be committed): ${untracked.split(/\s+/).join(", ")}`);
  }
} catch {
  // no untracked env files
}

if (failed) {
  process.exit(1);
}
