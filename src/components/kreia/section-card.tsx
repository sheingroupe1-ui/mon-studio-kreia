import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  id,
  kicker,
  title,
  action,
  children,
  className,
}: {
  id?: string;
  kicker?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[28px] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <div className="rounded-[20px] bg-[var(--bg-subtle)] px-5 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {kicker ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--champagne)]">
                {kicker}
              </p>
            ) : null}
            <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-[var(--fg)]">
              {title}
            </h2>
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Field({
  label,
  value,
  empty = "Non identifié",
}: {
  label: string;
  value?: string | null;
  empty?: string;
}) {
  const text = (value ?? "").trim();
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        {label}
      </p>
      <p className={text ? "text-sm leading-relaxed text-[var(--fg)]" : "text-sm italic text-[var(--fg-subtle)]"}>
        {text || empty}
      </p>
    </div>
  );
}

export function PromptBlock({ text }: { text: string }) {
  return (
    <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--bg)] p-4 font-mono text-[13px] leading-relaxed text-[var(--fg)]">
      {text || "—"}
    </pre>
  );
}
