// Provisions and runs a real (non-Docker, non-in-memory) local PostgreSQL cluster using
// the `embedded-postgres` package (bundles actual Postgres binaries, no external account,
// no Docker required). Used because this dev environment has neither Docker nor a
// pre-installed PostgreSQL, and no authenticated managed-database CLI is available.
//
// Usage: node scripts/db/local-postgres.mjs
// Keeps running in the foreground (or background, via the caller) until killed — the
// embedded-postgres library stops the cluster automatically on process exit, so this
// process must stay alive for as long as the app needs the database.

import EmbeddedPostgres from "embedded-postgres";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, access, cp, rm, chmod } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const LEGACY_DATA_DIR = path.join(ROOT, ".data", "postgres");
const IS_LINUX = process.platform === "linux";
// Keep the Windows-created cluster untouched. PostgreSQL's on-disk format is portable
// between Windows and Linux for the same major version, but runtime config and pid files
// are not. Linux therefore runs a one-time, non-destructive copy on a conflict-free port.
const DATA_DIR = path.join(ROOT, ".data", IS_LINUX ? "postgres-linux" : "postgres");
const ENV_PATH = path.join(ROOT, ".env");
const DB_NAME = "ivega";
const DB_USER = "ivega";
const DB_PORT = IS_LINUX ? 55432 : 5432;

async function readExistingPassword() {
  try {
    const content = await readFile(ENV_PATH, "utf-8");
    const match = content.match(/^DATABASE_URL="([^"]+)"/m);
    if (!match?.[1]) return null;
    const url = new URL(match[1]);
    return url.username === DB_USER ? decodeURIComponent(url.password) : null;
  } catch {
    return null;
  }
}

async function upsertEnvVar(key, value) {
  let content = "";
  try {
    content = await readFile(ENV_PATH, "utf-8");
  } catch {
    // .env doesn't exist yet
  }
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    content = content.trimEnd() + (content.trim() ? "\n" : "") + line + "\n";
  }
  await writeFile(ENV_PATH, content, "utf-8");
}

async function main() {
  // Reuse a previously generated password across restarts if the data dir already exists,
  // otherwise generate a fresh strong dev-only password.
  const existingPassword = await readExistingPassword();
  const password = existingPassword ?? randomBytes(24).toString("hex");

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: DB_USER,
    password,
    port: DB_PORT,
    persistent: true,
    // Windows' locale detection in embedded-postgres always resolves to "C", which
    // otherwise leaves initdb defaulting to a Windows codepage (WIN1252) rather than
    // UTF8 — breaks on the very first Arabic string. Force UTF8 explicitly.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {}, // keep noisy initdb/postgres stdout out of the way
    onError: (msg) => console.error("[postgres]", msg),
  });

  let alreadyInitialised = await access(path.join(DATA_DIR, "PG_VERSION"))
    .then(() => true)
    .catch(() => false);
  if (!alreadyInitialised && IS_LINUX) {
    const legacyExists = await access(path.join(LEGACY_DATA_DIR, "PG_VERSION"))
      .then(() => true)
      .catch(() => false);
    if (legacyExists) {
      console.log("Copying the existing local database into a Linux-compatible data directory...");
      await cp(LEGACY_DATA_DIR, DATA_DIR, { recursive: true, force: false });
      await chmod(DATA_DIR, 0o700);
      await rm(path.join(DATA_DIR, "postmaster.pid"), { force: true });
      const configPath = path.join(DATA_DIR, "postgresql.conf");
      const config = await readFile(configPath, "utf-8");
      await writeFile(configPath, config.replace(/^dynamic_shared_memory_type\s*=\s*windows.*$/m, "dynamic_shared_memory_type = posix"), "utf-8");
      alreadyInitialised = true;
    }
  }
  if (!alreadyInitialised) {
    console.log("Initialising a new local Postgres cluster (first run)...");
    await pg.initialise();
  }

  console.log("Starting local Postgres...");
  await pg.start();

  if (!alreadyInitialised) {
    console.log(`Creating database "${DB_NAME}"...`);
    await pg.createDatabase(DB_NAME);
  }

  const databaseUrl = `postgresql://${DB_USER}:${encodeURIComponent(password)}@localhost:${DB_PORT}/${DB_NAME}?schema=public`;
  await upsertEnvVar("DATABASE_URL", databaseUrl);
  await upsertEnvVar("DIRECT_URL", databaseUrl);

  console.log(`LOCAL_POSTGRES_READY http=localhost port=${DB_PORT}`);

  // Keep the process alive — embedded-postgres registers an exit hook that stops the
  // cluster when this process exits, so this script IS the long-running "service".
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await pg.stop();
    process.exit(0);
  });
  await new Promise(() => {});
}

main().catch((err) => {
  console.error("Failed to provision local Postgres:", err);
  process.exit(1);
});
