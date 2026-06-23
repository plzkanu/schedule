import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/images/soosan-logo.png";

interface BrandLogoProps {
  variant?: "light" | "dark";
  className?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "h-10 sm:h-11",
  md: "h-12 sm:h-14",
  lg: "h-16 sm:h-[4.5rem]",
} as const;

export function BrandLogo({
  variant = "dark",
  className,
  subtitle = "IT 프로젝트 현황 · 일정관리",
  size = "md",
}: BrandLogoProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        className={cn(
          "inline-flex w-fit items-center",
          isLight && "rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-white/20",
        )}
      >
        <Image
          src={LOGO_SRC}
          alt="SOOSAN"
          width={200}
          height={72}
          priority
          className={cn("w-auto object-contain object-left", SIZE_CLASS[size])}
        />
      </div>
      {subtitle ? (
        <p
          className={cn(
            "mt-2 text-sm leading-snug",
            isLight ? "text-white/75" : "text-slate-500",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
