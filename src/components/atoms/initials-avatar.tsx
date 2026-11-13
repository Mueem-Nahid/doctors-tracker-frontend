export function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span aria-hidden="true" className="initials-avatar">
      {initials || "A"}
    </span>
  );
}
