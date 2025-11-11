import { db } from "../../db";
import { usersTable } from "../../db/schema/users";

export async function getAllUsers() {
  return await db.select().from(usersTable);
}

export async function insertUser(data: {
  name: string;
  age: number;
  email: string;
}) {
  const [user] = await db.insert(usersTable).values(data).returning();
  return user;
}
