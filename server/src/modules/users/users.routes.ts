import { Hono } from "hono";
import * as userService from "./users.service";

type Bindings = {
  DATABASE_URL: string;
};

const users = new Hono<{ Bindings: Bindings }>();

// Get all users
users.get("/", async (c) => {
  try {
    const allUsers = await userService.getUsers(c.env.DATABASE_URL);
    return c.json(allUsers);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch users" }, { status: 500 });
  }
});

export default users;
