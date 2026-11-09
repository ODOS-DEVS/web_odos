import { Media } from "@/components/ui/media";
import { cn } from "@/libs/cn";

/**
 * A person's photo, falling back to their first and last initials.
 *
 * Google sign-in returns an `avatar_url`, so wherever the signed-in user is shown — header, menus,
 * chat — it should be this rather than a bare letter.
 */
export function UserAvatar({
  name,
  avatarUrl,
  className,
  sizes = "40px",
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  sizes?: string;
}) {
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const initials = nameParts.length
    ? `${nameParts[0].charAt(0)}${nameParts.length > 1 ? nameParts.at(-1)?.charAt(0) : ""}`.toUpperCase()
    : "?";

  if (!avatarUrl) {
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent", className)}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    <Media
      src={avatarUrl}
      name={name}
      sizes={sizes}
      className={cn("shrink-0 rounded-full", className)}
      imgClassName="object-cover"
    />
  );
}
