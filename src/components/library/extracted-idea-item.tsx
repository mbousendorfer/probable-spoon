import { MoreHorizontal, Pin, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

import { RelevanceBadge } from "./relevance-badge";
import type { ExtractedIdea, LibraryViewMode } from "./types";

interface ExtractedIdeaItemProps {
  idea: ExtractedIdea;
  selected?: boolean;
  viewMode?: LibraryViewMode;
  onSelectChange?: (checked: boolean) => void;
  onOpenDetail?: () => void;
}

export function ExtractedIdeaItem({
  idea,
  selected,
  viewMode = "compact",
  onSelectChange,
  onOpenDetail,
}: ExtractedIdeaItemProps) {
  const cardPaddingClass =
    viewMode === "comfortable"
      ? "p-[var(--ref-spacing-sm)] md:p-[var(--ref-spacing-md)]"
      : "p-[var(--ref-spacing-sm)]";
  const summaryClampClass = viewMode === "comfortable" ? "" : "line-clamp-2";

  return (
    <Card
      className={cn(
        "group rounded-[var(--ref-radius-xl)] border bg-[color:var(--ref-color-white)] shadow-none transition-colors",
        "hover:border-[color:var(--ref-color-grey-40)]",
        selected
          ? "border-[color:var(--ref-color-electric-blue-100)] bg-[color:var(--ref-color-electric-blue-10)]"
          : "border-[color:var(--ref-color-grey-20)]",
      )}
    >
      <CardContent className={cardPaddingClass}>
        <div className="flex items-start gap-[var(--ref-spacing-xs)]">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            aria-label={`Select ${idea.title}`}
            className="mt-[2px] shrink-0 border-[color:var(--ref-color-grey-20)] data-[state=checked]:border-[color:var(--ref-color-electric-blue-100)] data-[state=checked]:bg-[color:var(--ref-color-electric-blue-100)]"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-[var(--ref-spacing-xs)]">
            <div className="flex flex-col gap-[var(--ref-spacing-xs)] xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-[var(--ref-spacing-xxs)]">
                <RelevanceBadge priority={idea.priority} />
                <span className="inline-flex min-h-6 items-center gap-[var(--ref-spacing-xxxs)] rounded-[var(--ref-radius-full)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-80)]">
                  <Sparkles className="size-3.5" />
                  {Math.round(idea.confidence * 100)}% confidence
                </span>
                {idea.pinned ? (
                  <span className="inline-flex min-h-6 items-center gap-[var(--ref-spacing-xxxs)] rounded-[var(--ref-radius-full)] border border-[color:var(--ref-color-yellow-20)] bg-[color:var(--ref-color-yellow-10)] px-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-yellow-150)]">
                    <Pin className="size-3" />
                    Pinned
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-[var(--ref-spacing-xxs)] self-start">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-[var(--ref-radius-lg)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-electric-blue-150)] hover:bg-[color:var(--ref-color-electric-blue-10)]"
                >
                  <Wand2 className="size-4" />
                  Generate post
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-[var(--ref-radius-lg)] text-[color:var(--ref-color-grey-60)] hover:bg-[color:var(--ref-color-grey-05)] hover:text-[color:var(--ref-color-grey-100)]"
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Idea actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onOpenDetail}>Open details</DropdownMenuItem>
                    <DropdownMenuItem>Ask about this idea</DropdownMenuItem>
                    <DropdownMenuItem>Generate post draft</DropdownMenuItem>
                    <DropdownMenuItem>{idea.pinned ? "Unpin idea" : "Pin to top"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <button type="button" onClick={onOpenDetail} className="min-w-0 text-left">
              <div className="space-y-[var(--ref-spacing-xxs)]">
                <h4 className="text-[length:var(--ref-font-size-md)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)] transition-colors group-hover:text-[color:var(--ref-color-grey-100)]">
                  {idea.title}
                </h4>
                <p
                  className={cn(
                    "text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-md)] text-[color:var(--ref-color-grey-80)]",
                    summaryClampClass,
                  )}
                >
                  {idea.summary}
                </p>
              </div>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
