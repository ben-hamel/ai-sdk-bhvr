import { Hono } from "hono";
import * as userService from "./users.service";

type Bindings = {
  DATABASE_URL: string;
};

const users = new Hono<{ Bindings: Bindings }>();

// Get all users
users.get("/", async (c) => {
  try {
    const allUsers = await userService.getUsers();
    return c.json(allUsers);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch users" }, { status: 500 });
  }
});

// Create a new user
users.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const newUser = await userService.createUser(body);
    return c.json(newUser, { status: 201 });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create user" }, { status: 500 });
  }
});

export default users;
