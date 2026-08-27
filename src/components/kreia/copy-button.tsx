import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copier",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      className={cn("min-w-[6.5rem]", className)}
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        <Copy
          className={cn(
            "absolute transition-[opacity,transform,filter] duration-300",
            copied ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
          )}
        />
        <Check
          className={cn(
            "absolute transition-[opacity,transform,filter] duration-300",
            copied ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
          )}
        />
      </span>
      {copied ? "Copié" : label}
    </Button>
  );
}
