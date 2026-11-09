import "server-only";

import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PostgresJsTransaction } from "drizzle-orm/postgres-js";

import { getDatabase } from "@/lib/db/client";
import type * as schema from "@/lib/db/schema";

type UserTransaction = PostgresJsTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export async function withUserDatabaseContext<T>(
  userId: string,
  email: string,
  callback: (transaction: UserTransaction) => Promise<T>,
): Promise<T> {
  const db = getDatabase();
  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select set_config('request.jwt.claim.sub', ${userId}, true)`,
    );
    await transaction.execute(
      sql`select set_config('request.jwt.claim.email', ${email}, true)`,
    );
    await transaction.execute(
      sql`select set_config(
        'request.jwt.claims',
        json_build_object('sub', ${userId}, 'email', ${email})::text,
        true
      )`,
    );
    return callback(transaction);
  });
}
