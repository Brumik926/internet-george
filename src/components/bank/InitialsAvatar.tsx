export function getInitials(name?: string | null, fallback = "G"): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function InitialsAvatar({
  name,
  className = "w-12 h-12 text-base",
}: {
  name?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-[#196ee6] to-[#0f4bb5] font-bold tracking-wide text-white shadow-inner ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
