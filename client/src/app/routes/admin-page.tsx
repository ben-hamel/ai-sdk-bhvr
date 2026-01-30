import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | string[] | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | Date | null;
  createdAt?: string | Date | null;
};

type UserListResponse = {
  users?: AdminUser[];
  total?: number;
};

type AdminSession = {
  id: string;
  token?: string | null;
  userId?: string | null;
  createdAt?: string | Date | null;
  expiresAt?: string | Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
};

type AuthRole = "user" | "admin";

const isAdminRole = (role?: string | string[] | null) => {
  if (!role) return false;
  if (Array.isArray(role)) return role.includes("admin");
  return role
    .split(",")
    .map((value) => value.trim())
    .includes("admin");
};

export async function adminLoader() {
  const { data: session } = await authClient.getSession();
  if (!session || !isAdminRole(session.user?.role)) {
    throw new Response("Not Found", { status: 404 });
  }

  return { session };
}

export const AdminPage = () => {
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  const formatDate = (value: AdminUser["createdAt"]) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return formatter.format(date);
  };

  const formatSessionDate = (value: AdminSession["createdAt"]) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return formatter.format(date);
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    const source = name || email || "";
    const letters = source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    return letters || "U";
  };

  const formatRole = (role?: string | string[] | null) => {
    if (!role) return "user";
    if (Array.isArray(role)) return role.join(", ");
    return role;
  };

  const getRoleTokens = (value: string) => {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  };

  const parseRoleInput = (value: string) => {
    const trimmed = getRoleTokens(value);
    if (trimmed.length === 0) return null;
    if (trimmed.length === 1) return trimmed[0];
    return trimmed;
  };

  const roleTokens = useMemo(() => getRoleTokens(roleInput), [roleInput]);
  const roleTokenDuplicates = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const token of roleTokens) {
      if (seen.has(token)) duplicates.add(token);
      seen.add(token);
    }
    return [...duplicates];
  }, [roleTokens]);

  const updateUserState = (nextUser: AdminUser) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === nextUser.id ? nextUser : user)),
    );
    setSelectedUser((prev) =>
      prev && prev.id === nextUser.id ? nextUser : prev,
    );
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await authClient.admin.listUsers({
      query: {
        limit: 50,
        offset: 0,
      },
    });

    if (error) {
      setUsers([]);
      setTotal(null);
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load users.",
      );
      return;
    }

    const response = (data || {}) as UserListResponse;
    const nextUsers = response.users ?? [];

    setUsers(nextUsers);
    setTotal(typeof response.total === "number" ? response.total : null);
    setIsLoading(false);
  };

  const fetchSessions = async (userId: string) => {
    setSessionsLoading(true);
    setSessionsError(null);

    const { data, error } = await authClient.admin.listUserSessions({
      userId,
    });

    if (error) {
      setSessions([]);
      setSessionsLoading(false);
      setSessionsError(
        error instanceof Error ? error.message : "Unable to load sessions.",
      );
      return;
    }

    setSessions((data?.sessions as AdminSession[]) ?? []);
    setSessionsLoading(false);
  };

  const openUser = (user: AdminUser) => {
    setSelectedUser(user);
    setActionError(null);
    setBanReason("");
    setBanDuration("");
    setRoleInput(formatRole(user.role));
    setSessions([]);
    void fetchSessions(user.id);
  };

  const closeUser = () => {
    setSelectedUser(null);
    setSessions([]);
    setSessionsError(null);
    setActionError(null);
    setBanReason("");
    setBanDuration("");
    setRoleInput("");
  };

  const handleBanToggle = async () => {
    if (!selectedUser) return;
    
    if (session?.user?.id === selectedUser.id) {
      setActionError("You cannot ban yourself.");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    if (selectedUser.banned) {
      const { data, error } = await authClient.admin.unbanUser({
        userId: selectedUser.id,
      });

      if (error) {
        setActionLoading(false);
        setActionError(
          error instanceof Error ? error.message : "Failed to unban user.",
        );
        return;
      }

      if (data?.user) {
        updateUserState(data.user as AdminUser);
      }
      setActionLoading(false);
      return;
    }

    const durationValue = banDuration ? Number(banDuration) : undefined;
    const { data, error } = await authClient.admin.banUser({
      userId: selectedUser.id,
      banReason: banReason.trim() || undefined,
      banExpiresIn:
        durationValue && !Number.isNaN(durationValue) ? durationValue : undefined,
    });

    if (error) {
      setActionLoading(false);
      setActionError(
        error instanceof Error ? error.message : "Failed to ban user.",
      );
      return;
    }

    if (data?.user) {
      updateUserState(data.user as AdminUser);
    }
    setActionLoading(false);
  };

  const handleRevokeSession = async (sessionToken?: string | null) => {
    if (!sessionToken) return;
    setActionLoading(true);
    setActionError(null);
    const { error } = await authClient.admin.revokeUserSession({
      sessionToken,
    });

    if (error) {
      setActionLoading(false);
      setActionError(
        error instanceof Error ? error.message : "Failed to revoke session.",
      );
      return;
    }

    if (selectedUser) {
      await fetchSessions(selectedUser.id);
    }
    setActionLoading(false);
  };

  const handleRevokeAllSessions = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionError(null);
    const { error } = await authClient.admin.revokeUserSessions({
      userId: selectedUser.id,
    });

    if (error) {
      setActionLoading(false);
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to revoke sessions.",
      );
      return;
    }

    await fetchSessions(selectedUser.id);
    setActionLoading(false);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    if (session?.user?.id === selectedUser.id) {
      setActionError("You cannot update your own roles.");
      return;
    }

    const roleValue = parseRoleInput(roleInput);
    if (!roleValue) {
      setActionError("Please enter at least one role.");
      return;
    }
    if (roleTokenDuplicates.length > 0) {
      setActionError(
        `Duplicate roles found: ${roleTokenDuplicates.join(", ")}.`,
      );
      return;
    }
    const roleLabel = Array.isArray(roleValue) ? roleValue.join(", ") : roleValue;
    const confirmed = window.confirm(
      `Update roles for ${selectedUser.email || selectedUser.name || "user"} to: ${roleLabel}?`,
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionError(null);

    const { data, error } = await authClient.admin.setRole({
      userId: selectedUser.id,
      role: roleValue as AuthRole | AuthRole[],
    });

    if (error) {
      setActionLoading(false);
      setActionError(
        error instanceof Error ? error.message : "Failed to update role.",
      );
      return;
    }

    if (data?.user) {
      updateUserState(data.user as AdminUser);
      setRoleInput(formatRole((data.user as AdminUser).role));
    }
    setActionLoading(false);
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">
              Review and manage registered users.
            </p>
          </div>
          <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="border-b">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading users..."
                  : total !== null
                    ? `Showing ${users.length} of ${total} users`
                    : `Showing ${users.length} users`}
              </CardDescription>
            </div>
            <CardAction>
              <Badge variant="secondary">Admin only</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            {errorMessage ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            {!errorMessage && isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : null}
            {!errorMessage && !isLoading && users.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No users found yet.
              </div>
            ) : null}
            {!errorMessage && !isLoading && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-3 text-left font-medium">User</th>
                      <th className="py-3 text-left font-medium">Role</th>
                      <th className="py-3 text-left font-medium">Status</th>
                      <th className="py-3 text-left font-medium">Created</th>
                      <th className="py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              {user.image ? (
                                <AvatarImage
                                  src={user.image}
                                  alt={user.name || user.email || "User"}
                                />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.name || "Unnamed user"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant="outline">
                            {formatRole(user.role)}
                          </Badge>
                        </td>
                        <td className="py-4 pr-4">
                          {user.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                        </td>
                        <td className="py-4">{formatDate(user.createdAt)}</td>
                        <td className="py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUser(user)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
      {selectedUser ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeUser}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l bg-background shadow-xl">
            <div className="flex h-full flex-col">
              <div className="border-b px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      {selectedUser.image ? (
                        <AvatarImage
                          src={selectedUser.image}
                          alt={
                            selectedUser.name || selectedUser.email || "User"
                          }
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(selectedUser.name, selectedUser.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-lg font-semibold">
                        {selectedUser.name || "Unnamed user"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedUser.email || "No email"}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={closeUser}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Overview
                    </h2>
                    <Badge variant="outline">
                      {formatRole(selectedUser.role)}
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      {selectedUser.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span>Joined</span>
                      <span>{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    {selectedUser.banned ? (
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div>
                          Reason: {selectedUser.banReason || "Not provided"}
                        </div>
                        <div>
                          Expires: {formatDate(selectedUser.banExpires)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Role Management
                  </h2>
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-input">Roles</Label>
                      <Input
                        id="role-input"
                        value={roleInput}
                        onChange={(event) => setRoleInput(event.target.value)}
                        placeholder="admin, user"
                      />
                      {roleTokens.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {roleTokens.map((token) => (
                            <Badge
                              key={token}
                              variant="secondary"
                              className="gap-2"
                            >
                              {token}
                              <button
                                type="button"
                                className="text-xs opacity-70 transition hover:opacity-100"
                                onClick={() => {
                                  const nextTokens = roleTokens.filter(
                                    (role) => role !== token,
                                  );
                                  setRoleInput(nextTokens.join(", "));
                                }}
                                aria-label={`Remove ${token}`}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {roleTokenDuplicates.length > 0 ? (
                        <p className="text-xs text-destructive">
                          Duplicate roles: {roleTokenDuplicates.join(", ")}.
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Enter one or more roles separated by commas.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRoleUpdate}
                      disabled={actionLoading || (session?.user?.id === selectedUser.id)}
                    >
                      {actionLoading ? "Updating..." : "Update role"}
                    </Button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Ban Controls
                  </h2>
                  {!selectedUser.banned ? (
                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="space-y-2">
                        <Label htmlFor="ban-reason">Ban reason</Label>
                        <Textarea
                          id="ban-reason"
                          value={banReason}
                          onChange={(event) => setBanReason(event.target.value)}
                          placeholder="Optional reason for banning this user."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ban-duration">
                          Ban duration (seconds)
                        </Label>
                        <Input
                          id="ban-duration"
                          type="number"
                          min="0"
                          value={banDuration}
                          onChange={(event) =>
                            setBanDuration(event.target.value)
                          }
                          placeholder="Leave blank for indefinite ban."
                        />
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleBanToggle}
                        disabled={actionLoading || (session?.user?.id === selectedUser.id)}
                      >
                        {actionLoading ? "Working..." : "Ban user"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        This user is currently banned.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleBanToggle}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Working..." : "Unban user"}
                      </Button>
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Sessions
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRevokeAllSessions}
                      disabled={actionLoading || sessionsLoading}
                    >
                      Revoke all
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4 space-y-3">
                    {sessionsError ? (
                      <div className="text-sm text-destructive">
                        {sessionsError}
                      </div>
                    ) : null}
                    {!sessionsError && sessionsLoading ? (
                      <div className="text-sm text-muted-foreground">
                        Loading sessions...
                      </div>
                    ) : null}
                    {!sessionsError &&
                    !sessionsLoading &&
                    sessions.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No active sessions.
                      </div>
                    ) : null}
                    {!sessionsError &&
                    !sessionsLoading &&
                    sessions.length > 0 ? (
                      <div className="space-y-3">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="rounded-md border px-3 py-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium">
                                Session {session.id.slice(0, 8)}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeSession(session.token)}
                                disabled={actionLoading || !session.token}
                              >
                                Revoke
                              </Button>
                            </div>
                            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                              <div>
                                Created: {formatSessionDate(session.createdAt)}
                              </div>
                              <div>
                                Expires: {formatSessionDate(session.expiresAt)}
                              </div>
                              <div>IP: {session.ipAddress || "—"}</div>
                              <div>
                                User agent: {session.userAgent || "—"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </section>

                {actionError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {actionError}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
