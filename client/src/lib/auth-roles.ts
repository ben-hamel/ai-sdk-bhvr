export const isAdminRole = (role?: string | string[] | null) => {
  if (!role) return false;
  if (Array.isArray(role)) return role.includes("admin");
  return role
    .split(",")
    .map((value) => value.trim())
    .includes("admin");
};
