import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  FileText,
  Globe2,
  Layers3,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { SourceActions } from "./source-actions";
import type { ExtractionStrength, LibrarySource } from "./types";

const strengthStyles: Record<ExtractionStrength, string> = {
  weak: "bg-[color:var(--ref-color-grey-05)] text-[color:var(--ref-color-grey-80)] border-[color:var(--ref-color-grey-10)]",
  moderate:
    "bg-[color:var(--ref-color-yellow-10)] text-[color:var(--ref-color-yellow-150)] border-[color:var(--ref-color-yellow-20)]",
  strong:
    "bg-[color:var(--ref-color-green-10)] text-[color:var(--ref-color-green-150)] border-[color:var(--ref-color-green-20)]",
};

function SourceStatusBadge({ status }: Pick<LibrarySource, "status">) {
  if (status === "processing") {
    return (
      <Badge className="gap-[var(--ref-spacing-xxxs)] rounded-[var(--ref-radius-full)] bg-[color:var(--ref-color-electric-blue-10)] text-[color:var(--ref-color-electric-blue-150)] hover:bg-[color:var(--ref-color-electric-blue-10)]">
        <LoaderCircle className="size-3.5 animate-spin" />
        Processing
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge className="gap-[var(--ref-spacing-xxxs)] rounded-[var(--ref-radius-full)] bg-[color:var(--ref-color-red-10)] text-[color:var(--ref-color-red-150)] hover:bg-[color:var(--ref-color-red-10)]">
        <AlertCircle className="size-3.5" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge className="gap-[var(--ref-spacing-xxxs)] rounded-[var(--ref-radius-full)] bg-[color:var(--ref-color-green-10)] text-[color:var(--ref-color-green-150)] hover:bg-[color:var(--ref-color-green-10)]">
      <Sparkles className="size-3.5" />
      Processed
    </Badge>
  );
}

export function LibrarySourceHeader({
  source,
  ideaCount,
  open,
  onToggle,
}: {
  source: LibrarySource;
  ideaCount: number;
  open: boolean;
  onToggle: () => void;
}) {
  const SourceIcon = source.sourceType === "pdf" ? FileText : Globe2;

  return (
    <div className="flex flex-col gap-[var(--ref-spacing-xs)] rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-sm)] md:px-[var(--ref-spacing-md)]">
      <div className="flex flex-col gap-[var(--ref-spacing-sm)] xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-[var(--ref-spacing-sm)]">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--ref-radius-xl)] bg-[color:var(--ref-color-orange-10)] text-[color:var(--ref-color-orange-150)]">
            <SourceIcon className="size-[18px]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-[var(--ref-spacing-xxs)]">
              <h3 className="truncate text-[length:var(--ref-font-size-md)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)]">
                {source.name}
              </h3>
              <SourceStatusBadge status={source.status} />
            </div>

            <div className="mt-[var(--ref-spacing-xxs)] flex flex-wrap items-center gap-x-[var(--ref-spacing-xs)] gap-y-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-xs)] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-80)]">
              <span className="inline-flex items-center gap-[var(--ref-spacing-xxs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.08em] text-[color:var(--ref-color-grey-60)]">
                {source.sourceType === "pdf" ? "PDF source" : "URL source"}
              </span>
              <span className="inline-flex items-center gap-[var(--ref-spacing-xxs)]">
                <Layers3 className="size-3.5" />
                {ideaCount} extracted ideas
              </span>
              <span className="inline-flex items-center gap-[var(--ref-spacing-xxs)]">
                <CalendarDays className="size-3.5" />
                Imported {source.importedAt}
              </span>
              {source.extractionStrength ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-[var(--ref-spacing-xxs)] rounded-[var(--ref-radius-full)] border px-[var(--ref-spacing-xxs)] py-[var(--ref-spacing-xxxs)] font-[var(--ref-font-weight-bold)]",
                    strengthStyles[source.extractionStrength],
                  )}
                >
                  <Sparkles className="size-3.5" />
                  {source.extractionStrength} signal
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="size-7 rounded-[var(--ref-radius-lg)] text-[color:var(--ref-color-grey-60)] hover:bg-[color:var(--ref-color-grey-05)] hover:text-[color:var(--ref-color-grey-100)]"
              >
                <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                <span className="sr-only">{open ? "Collapse source" : "Expand source"}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[var(--ref-spacing-xxs)] self-end xl:self-center">
          <SourceActions />
          <SourceActions compact className="md:hidden" />
        </div>
      </div>
    </div>
  );
}
