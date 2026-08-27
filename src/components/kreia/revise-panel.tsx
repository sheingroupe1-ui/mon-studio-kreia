import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RevisePanel({
  title,
  placeholder,
  busy,
  onSubmit,
  onClose,
}: {
  title: string;
  placeholder: string;
  busy?: boolean;
  onSubmit: (instruction: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_94%,transparent)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--fg)]">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            Fermer
          </button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={busy || value.trim().length < 4}
            onClick={() => onSubmit(value.trim())}
          >
            {busy ? "Application…" : "Appliquer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
