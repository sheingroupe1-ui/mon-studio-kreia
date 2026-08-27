import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[var(--bg,#0b0d10)] px-6 text-center text-[var(--fg,#f5f5f2)]">
      <span className="text-[var(--color-danger,#c45c4a)]" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl">Un incident de plateau</h1>
      <p className="max-w-md text-sm break-words text-[var(--fg-muted,#a8adb8)]">
        {error.message || "Une erreur inattendue est survenue. Rechargez la page."}
      </p>
    </main>
  );
}
