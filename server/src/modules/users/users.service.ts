import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as usersRepository from "./users.repository";

/**
 * Get all users
 * @param db - Database connection instance
 * @returns Array of user records
 */
export async function getUsers(db: NodePgDatabase) {
  return await usersRepository.getAllUsers(db);
}

/**
 * Create a new user
 * @param db - Database connection instance
 * @param data - User data (name, age, email)
 * @returns Created user record
 */
export async function createUser(
  db: NodePgDatabase,
  data: {
    name: string;
    age: number;
    email: string;
  },
) {
  return await usersRepository.insertUser(db, data);
}
