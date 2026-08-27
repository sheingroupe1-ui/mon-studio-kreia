import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "gold" | "ok" | "warn" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tone === "neutral" &&
          "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)] text-[var(--fg-muted)]",
        tone === "gold" && "bg-[color-mix(in_oklab,var(--accent-fill)_70%,transparent)] text-[var(--accent)]",
        tone === "ok" && "bg-[color-mix(in_oklab,var(--color-ok)_18%,transparent)] text-[var(--color-ok)]",
        tone === "warn" &&
          "bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)] text-[#e7b1a7]",
        tone === "muted" && "text-[var(--fg-subtle)] bg-transparent shadow-[inset_0_0_0_1px_var(--border)]",
        className,
      )}
      {...props}
    />
  );
}
