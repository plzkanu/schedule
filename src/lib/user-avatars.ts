import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";

export const AVATAR_BUCKET = "user-avatars";
export const MAX_AVATAR_BYTES = 512 * 1024;

export const AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

export function isAllowedAvatarMimeType(type: string): type is AvatarMimeType {
  return AVATAR_MIME_TYPES.includes(type as AvatarMimeType);
}

export function getUserInitials(name: string) {
  const trimmed = name.split("(")[0]?.trim() ?? name.trim();
  return trimmed.charAt(0) || "?";
}

export function buildUserAvatarMap(
  users: Array<{ id: string; avatarUrl?: string | null }>,
): Record<string, string> {
  return Object.fromEntries(
    users
      .filter((user) => user.avatarUrl)
      .map((user) => [user.id, user.avatarUrl as string]),
  );
}

function getAvatarExtension(contentType: AvatarMimeType) {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function toDataUrl(contentType: AvatarMimeType, buffer: Buffer) {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function saveAvatarUrl(userId: string, avatarUrl: string | null) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("it_users")
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return formatSupabaseNetworkError(error.message);
  }

  return null;
}

async function uploadToStorage(
  userId: string,
  buffer: Buffer,
  contentType: AvatarMimeType,
) {
  const supabase = createServerClient();
  const path = `${userId}/avatar.${getAvatarExtension(contentType)}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, {
      upsert: true,
      contentType,
      cacheControl: "3600",
    });

  if (error) {
    return { url: null, error: formatSupabaseNetworkError(error.message) };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const versionedUrl = `${data.publicUrl}?v=${Date.now()}`;
  return { url: versionedUrl, error: null };
}

export async function uploadUserAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ avatarUrl: string | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { avatarUrl: null, error: "Supabase 설정이 필요합니다." };
  }

  if (!isAllowedAvatarMimeType(contentType)) {
    return {
      avatarUrl: null,
      error: "JPEG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다.",
    };
  }

  if (buffer.byteLength > MAX_AVATAR_BYTES) {
    return {
      avatarUrl: null,
      error: "이미지는 512KB 이하여야 합니다.",
    };
  }

  const storageResult = await uploadToStorage(userId, buffer, contentType);
  const avatarUrl =
    storageResult.url ?? toDataUrl(contentType, buffer);

  const saveError = await saveAvatarUrl(userId, avatarUrl);
  if (saveError) {
    return { avatarUrl: null, error: saveError };
  }

  return { avatarUrl, error: null };
}

export async function deleteUserAvatar(
  userId: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase 설정이 필요합니다." };
  }

  const supabase = createServerClient();
  const { data: files } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (files && files.length > 0) {
    const paths = files.map((file) => `${userId}/${file.name}`);
    await supabase.storage.from(AVATAR_BUCKET).remove(paths);
  }

  return { error: await saveAvatarUrl(userId, null) };
}
