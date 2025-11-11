import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { usersTable } from "../../db/schema/users";

export async function getAllUsers(db: NodePgDatabase) {
  return await db.select().from(usersTable);
}

export async function insertUser(
  db: NodePgDatabase,
  data: {
    name: string;
    age: number;
    email: string;
  },
) {
  const [user] = await db.insert(usersTable).values(data).returning();
  return user;
}
