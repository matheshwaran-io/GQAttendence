import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Inspecting database tables...");
  const result = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `);
  console.log("Existing tables:", result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
