export function formatUserDisplayLabel(
  name: string,
  department?: string | null,
): string {
  const dept = department?.trim();
  return dept ? `${name} (${dept})` : name;
}

export function buildUserDisplayMap(
  users: Array<{ id: string; name: string; department?: string | null }>,
): Record<string, string> {
  return Object.fromEntries(
    users.map((user) => [
      user.id,
      formatUserDisplayLabel(user.name, user.department),
    ]),
  );
}

export function resolveUserDisplayLabel(
  userMap: Record<string, string>,
  userId: string | null | undefined,
  fallback = "알 수 없음",
): string {
  if (!userId) {
    return fallback;
  }
  return userMap[userId] ?? fallback;
}
