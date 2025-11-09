import { Pool } from "pg";

/**
 * Get all users from the database
 * @param databaseUrl - PostgreSQL connection string
 * @returns Array of user records
 */
export async function getAllUsers(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query("SELECT * FROM users");
    return rows;
  } finally {
    await pool.end();
  }
}
