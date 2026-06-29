"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { getUserInitials } from "@/lib/user-avatars";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-xl",
} as const;

interface UserAvatarProps {
  userId?: string;
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  fallbackClassName?: string;
  editable?: boolean;
  onAvatarChange?: (avatarUrl: string | null) => void;
}

export function UserAvatar({
  userId,
  name,
  avatarUrl,
  size = "md",
  className,
  fallbackClassName = "bg-brand-navy text-white ring-brand-cyan/30",
  editable = false,
  onAvatarChange,
}: UserAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState(avatarUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentUrl(avatarUrl ?? null);
  }, [avatarUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        avatarUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "이미지 업로드에 실패했습니다.");
        return;
      }

      const nextUrl = data.avatarUrl ?? null;
      setCurrentUrl(nextUrl);
      onAvatarChange?.(nextUrl);
    } catch {
      setError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    if (!userId) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "이미지 삭제에 실패했습니다.");
        return;
      }

      setCurrentUrl(null);
      onAvatarChange?.(null);
    } catch {
      setError("이미지 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  }

  const displayUrl = currentUrl ?? avatarUrl;
  const initials = getUserInitials(name);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <button
        type="button"
        disabled={!editable || isUploading}
        onClick={() => editable && inputRef.current?.click()}
        className={cn(
          "relative overflow-hidden rounded-full ring-2 ring-inset",
          SIZE_CLASS[size],
          !displayUrl && fallbackClassName,
          editable && "cursor-pointer transition hover:opacity-90",
          !editable && "cursor-default",
        )}
        title={editable ? "프로필 이미지 변경" : name}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={`${name} 프로필`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bold">
            {initials}
          </span>
        )}

        {editable && !isUploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition hover:bg-black/35 hover:opacity-100">
            <Camera className="h-4 w-4" />
          </span>
        ) : null}

        {isUploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        ) : null}
      </button>

      {editable && displayUrl && !isUploading ? (
        <button
          type="button"
          onClick={() => void handleRemove()}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 transition hover:text-red-600"
          title="이미지 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      ) : null}

      {editable ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />
      ) : null}

      {error ? (
        <p className="absolute left-0 top-full z-10 mt-1 w-40 text-[10px] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
