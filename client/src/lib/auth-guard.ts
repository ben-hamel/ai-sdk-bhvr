import { redirect } from "react-router";
import { authClient } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/auth-roles";

export async function requireAuth() {
  const { data: session } = await authClient.getSession();
  if (!session) throw redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!isAdminRole(session.user?.role)) throw new Response("Not Found", { status: 404 });
  return session;
}
