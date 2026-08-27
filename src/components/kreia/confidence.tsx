import { Badge } from "@/components/ui/badge";
import type { Confidence } from "@/lib/kreia/types";

const LABELS: Record<Confidence, string> = {
  observed: "Observé",
  inferred: "Déduit",
  proposed: "Proposé",
};

export function ConfidenceBadge({ value }: { value: Confidence }) {
  return (
    <Badge tone={value === "observed" ? "ok" : value === "proposed" ? "gold" : "muted"}>
      {LABELS[value]}
    </Badge>
  );
}
