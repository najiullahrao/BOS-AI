import { cn } from "@/lib/utils";

export interface OrgAvatarProps {
  name: string;
  logoUrl: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function OrgAvatar({ name, logoUrl, size = "sm", className }: OrgAvatarProps) {
  const dimension = size === "sm" ? "size-5" : "size-8";

  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- small mock avatar, not worth next/image config for a demo
    return <img src={logoUrl} alt="" className={cn(dimension, "shrink-0 rounded-sm object-cover", className)} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn(
        dimension,
        "flex shrink-0 items-center justify-center rounded-sm bg-primary/10 font-semibold text-primary",
        size === "sm" ? "text-[10px]" : "text-xs",
        className
      )}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
