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
