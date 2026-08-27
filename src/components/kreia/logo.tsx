import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function Mark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/mark.png"
      alt=""
      className={cn("size-9 rounded-full object-cover", className)}
    />
  );
}

export function Wordmark({
  compact = false,
  to = "/",
}: {
  compact?: boolean;
  to?: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-2.5 no-underline" aria-label="KREIA Studio">
      <Mark className={compact ? "size-9" : "size-11"} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.4rem] font-medium tracking-[-0.03em] text-[var(--fg)]">
          KREIA
        </span>
        <span
          className={cn(
            "mt-0.5 font-medium uppercase tracking-[0.22em] text-[var(--champagne)]",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          Studio
        </span>
      </span>
    </Link>
  );
}
