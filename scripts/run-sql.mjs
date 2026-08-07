// Applies a raw SQL file (supabase/storage.sql, supabase/rls.sql) directly
// against the database via DIRECT_URL — no Supabase CLI subcommand or
// `psql` install required, just Node + the `pg` package.
//
// Usage: node --env-file=.env.local scripts/run-sql.mjs <path-to-sql-file>
import { readFileSync } from "node:fs";
import { Client } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/run-sql.mjs <path-to-sql-file>");
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error(
    "DIRECT_URL is not set. Run this with --env-file=.env.local (see the db:sql npm script) " +
      "and make sure DIRECT_URL is filled in there.",
  );
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new Client({ connectionString: process.env.DIRECT_URL });

await client.connect();
try {
  await client.query(sql);
  console.log(`✓ Applied ${file}`);
} catch (err) {
  console.error(`✗ Failed to apply ${file}`);
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
