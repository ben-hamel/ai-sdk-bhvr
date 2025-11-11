import * as usersRepository from "./users.repository";

/**
 * Get all users
 * @returns Array of user records
 */
export async function getUsers() {
  return await usersRepository.getAllUsers();
}

/**
 * Create a new user
 * @param data - User data (name, age, email)
 * @returns Created user record
 */
export async function createUser(data: {
  name: string;
  age: number;
  email: string;
}) {
  return await usersRepository.insertUser(data);
}
