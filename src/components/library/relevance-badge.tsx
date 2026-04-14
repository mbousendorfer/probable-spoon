import { AlertTriangle, Minus, Sparkles, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { IdeaPriority } from "./types";

const priorityConfig: Record<
  IdeaPriority,
  { label: string; icon: LucideIcon; className: string }
> = {
  high: {
    label: "High relevance",
    icon: Sparkles,
    className:
      "border-[color:var(--ref-color-orange-20)] bg-[color:var(--ref-color-orange-10)] text-[color:var(--ref-color-orange-150)]",
  },
  medium: {
    label: "Medium relevance",
    icon: Minus,
    className:
      "border-[color:var(--ref-color-electric-blue-20)] bg-[color:var(--ref-color-electric-blue-10)] text-[color:var(--ref-color-electric-blue-150)]",
  },
  low: {
    label: "Low relevance",
    icon: AlertTriangle,
    className:
      "border-[color:var(--ref-color-grey-10)] bg-[color:var(--ref-color-grey-05)] text-[color:var(--ref-color-grey-80)]",
  },
};

export function RelevanceBadge({
  priority,
  className,
}: {
  priority: IdeaPriority;
  className?: string;
}) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex h-6 items-center gap-[var(--ref-spacing-xxxs)] rounded-[var(--ref-radius-full)] border px-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-xs)]",
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  );
}
