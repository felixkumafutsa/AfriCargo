import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

let database: PostgresJsDatabase<typeof schema> | undefined;

export function getDatabase() {
  if (database) {
    return database;
  }

  const databaseUrl = process.env.AFRICARGO_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "AFRICARGO_DATABASE_URL is required. Configure the restricted runtime database role; do not use the Supabase service-role key.",
    );
  }

  const client = postgres(databaseUrl, {
    max: 5,
    prepare: false,
  });
  database = drizzle(client, { schema });

  return database;
}
