import { Hono } from "hono";
import type { ApiResponse } from "shared/dist";

const health = new Hono();

health.get("/", (c) => {
  return c.text("Hello Hono!");
});

health.get("/hello", async (c) => {
  const data: ApiResponse = {
    message: "Hello BHVR!",
    success: true,
  };

  return c.json(data, { status: 200 });
});

export default health;
