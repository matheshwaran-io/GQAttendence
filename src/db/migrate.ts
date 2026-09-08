import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";

async function main() {
  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: "./supabase/migrations" });
  console.log("Database migrations applied successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration runner failed:", err);
  process.exit(1);
});
