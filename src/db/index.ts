import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

let client: ReturnType<typeof postgres>;

if (process.env.NODE_ENV === "production") {
  client = postgres(connectionString, { prepare: false });
} else {
  // Prevent multiple connections during hot reloading in development
  if (!(global as any).postgresClient) {
    (global as any).postgresClient = postgres(connectionString, { prepare: false });
  }
  client = (global as any).postgresClient;
}

export const db = drizzle(client, { schema });
export * as schema from "./schema";
