import { Link, useRouterState } from "@tanstack/react-router";
import { Folder, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wordmark } from "./logo.tsx";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-dvh bg-[var(--bg)] text-[var(--fg)]">
      <div className="studio-wash" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Wordmark compact />
          <nav className="flex items-center gap-1">
            <Link
              to="/projects"
              aria-label="Mes projets"
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm text-[var(--fg)]/80 transition-colors duration-150 hover:text-[var(--fg)]",
                pathname.startsWith("/projects") && "text-[var(--fg)]",
              )}
            >
              <Folder className="size-4" />
              <span className="hidden sm:inline">Mes projets</span>
            </Link>
            <Button asChild size="sm">
              <Link to="/new">
                <Plus className="size-4" />
                Nouveau
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
