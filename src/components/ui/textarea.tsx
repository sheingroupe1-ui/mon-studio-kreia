import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full resize-y rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] px-3.5 py-3 text-sm leading-relaxed text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)] placeholder:text-[var(--fg-subtle)] transition-[box-shadow] duration-150 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-40",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
