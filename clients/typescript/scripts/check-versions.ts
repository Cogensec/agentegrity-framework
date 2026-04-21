#!/usr/bin/env node
/**
 * Assert that every `@agentegrity/*` package.json version matches the
 * Python `pyproject.toml` version. Run in CI before tagging a release.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = resolve(new URL("../../..", import.meta.url).pathname);
const pyproject = readFileSync(join(repoRoot, "pyproject.toml"), "utf8");
const pyMatch = pyproject.match(/^version\s*=\s*"([^"]+)"/m);
if (!pyMatch) {
  console.error("could not find version in pyproject.toml");
  process.exit(2);
}
const pyVersion = pyMatch[1];

const pkgsDir = resolve(new URL("../packages", import.meta.url).pathname);
const pkgs = readdirSync(pkgsDir);

let failed = false;
for (const name of pkgs) {
  const pkgPath = join(pkgsDir, name, "package.json");
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      name: string;
      version: string;
      private?: boolean;
    };
    if (pkg.private) continue;
    if (pkg.version !== pyVersion) {
      console.error(
        `✗ ${pkg.name}@${pkg.version} does not match pyproject ${pyVersion}`,
      );
      failed = true;
    } else {
      console.log(`✓ ${pkg.name}@${pkg.version}`);
    }
  } catch {
    // ignore
  }
}

if (failed) {
  console.error("\nVersion drift detected. Bump all packages together.");
  process.exit(1);
}
console.log(`\nAll packages match pyproject version ${pyVersion}.`);
