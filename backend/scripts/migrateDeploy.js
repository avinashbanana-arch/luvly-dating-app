const { spawnSync } = require("child_process");

require("dotenv").config();

function migrationUrl() {
  const configuredUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!configuredUrl) {
    throw new Error("DATABASE_URL or DIRECT_URL must be configured before running migrations.");
  }

  const url = new URL(configuredUrl);
  // Neon pooled endpoints are ideal for the running API but Prisma's schema
  // engine requires a direct endpoint for DDL. A supplied DIRECT_URL wins;
  // otherwise safely derive Neon's direct hostname from its pooler hostname.
  url.hostname = url.hostname.replace(/-pooler(?=\.)/, "");
  return url.toString();
}

const result = spawnSync(
  process.execPath,
  [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: migrationUrl() },
  }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
