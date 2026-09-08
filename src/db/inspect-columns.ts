import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  const deptCols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'departments';
  `);
  console.log("Departments columns:", deptCols);

  const progCols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'programmes';
  `);
  console.log("Programmes columns:", progCols);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
