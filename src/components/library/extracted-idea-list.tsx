import { FileText, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { ExtractedIdeaItem } from "./extracted-idea-item";
import type { ExtractedIdea, LibraryViewMode } from "./types";

interface ExtractedIdeaListProps {
  ideas: ExtractedIdea[];
  selectedIds: string[];
  viewMode: LibraryViewMode;
  loading?: boolean;
  onIdeaSelect: (ideaId: string, nextChecked: boolean) => void;
  onOpenIdea: (idea: ExtractedIdea) => void;
}

function IdeaSkeleton() {
  return (
    <div className="space-y-[var(--ref-spacing-xxs)] rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)]">
      <div className="h-4 w-2/5 animate-pulse rounded bg-[color:var(--ref-color-grey-10)]" />
      <div className="h-3 w-full animate-pulse rounded bg-[color:var(--ref-color-grey-10)]" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-[color:var(--ref-color-grey-10)]" />
    </div>
  );
}

export function ExtractedIdeaList({
  ideas,
  selectedIds,
  viewMode,
  loading,
  onIdeaSelect,
  onOpenIdea,
}: ExtractedIdeaListProps) {
  if (loading) {
    return (
      <div className="grid gap-[var(--ref-spacing-xs)]">
        {Array.from({ length: 3 }).map((_, index) => (
          <IdeaSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="rounded-[var(--ref-radius-xl)] border border-dashed border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-md)] py-[var(--ref-spacing-lg)] text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--ref-radius-xl)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-grey-60)]">
          <FileText className="size-5" />
        </div>
        <h4 className="mt-[var(--ref-spacing-sm)] text-[length:var(--ref-font-size-sm)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-sm)] text-[color:var(--ref-color-grey-150)]">
          No ideas extracted yet
        </h4>
        <p className="mx-auto mt-[var(--ref-spacing-xxs)] max-w-md text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-80)]">
          This source is ready, but there are no content ideas saved yet. Run another extraction pass or ask a
          question to refine the output.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--ref-spacing-xs)]">
      <div className="flex flex-col gap-[var(--ref-spacing-xxs)] rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
            Extracted ideas
          </p>
          <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-md)] text-[color:var(--ref-color-grey-80)]">
            Review each idea as a self-contained card, then select, compare, or generate a post without losing source context.
          </p>
        </div>
        <div className="inline-flex items-center gap-[var(--ref-spacing-xxs)] rounded-[var(--ref-radius-full)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] px-[var(--ref-spacing-xs)] py-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-80)]">
          <Sparkles className="size-3.5 text-[color:var(--ref-color-electric-blue-100)]" />
          {ideas.length} ready to review
        </div>
      </div>

      <div
        className={cn(
          "grid gap-[var(--ref-spacing-xs)]",
          viewMode === "comfortable" && "gap-[var(--ref-spacing-sm)]",
        )}
      >
        {ideas.map((idea) => (
          <ExtractedIdeaItem
            key={idea.id}
            idea={idea}
            selected={selectedIds.includes(idea.id)}
            viewMode={viewMode}
            onSelectChange={(checked) => onIdeaSelect(idea.id, checked)}
            onOpenDetail={() => onOpenIdea(idea)}
          />
        ))}
      </div>
    </div>
  );
}
