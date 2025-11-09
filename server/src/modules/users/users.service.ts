import * as usersRepository from "./users.repository";

/**
 * Get all users
 * @param databaseUrl - PostgreSQL connection string
 * @returns Array of user records
 */
export async function getUsers(databaseUrl: string) {
  return await usersRepository.getAllUsers(databaseUrl);
}
