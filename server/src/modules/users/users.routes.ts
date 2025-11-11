import { Hono } from "hono";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbMiddleware } from "../../middleware/db";
import * as userService from "./users.service";

type Bindings = {
  DATABASE_URL: string;
};

type Variables = {
  db: NodePgDatabase;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply db middleware to all user routes
app.use("*", dbMiddleware);

// Get all users
app.get("/", async (c) => {
  try {
    const db = c.get("db");
    const allUsers = await userService.getUsers(db);
    return c.json(allUsers);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch users" }, { status: 500 });
  }
});

// Create a new user
app.post("/", async (c) => {
  try {
    const db = c.get("db");
    const body = await c.req.json();
    const newUser = await userService.createUser(db, body);
    return c.json(newUser, { status: 201 });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create user" }, { status: 500 });
  }
});

export default app;
