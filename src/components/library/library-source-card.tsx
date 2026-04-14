import { AlertTriangle, LoaderCircle, WandSparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

import { ExtractedIdeaList } from "./extracted-idea-list";
import { LibrarySourceHeader } from "./library-source-header";
import type { ExtractedIdea, LibrarySource, LibraryViewMode } from "./types";

interface LibrarySourceCardProps {
  source: LibrarySource;
  viewMode: LibraryViewMode;
  defaultOpen?: boolean;
  selectedIdeaIds: string[];
  onIdeaSelect: (ideaId: string, checked: boolean) => void;
  onOpenIdea: (idea: ExtractedIdea) => void;
}

export function LibrarySourceCard({
  source,
  viewMode,
  defaultOpen = true,
  selectedIdeaIds,
  onIdeaSelect,
  onOpenIdea,
}: LibrarySourceCardProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Card className="overflow-hidden rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-bg)] shadow-none">
      <Collapsible open={open} onOpenChange={setOpen}>
        <LibrarySourceHeader
          source={source}
          ideaCount={source.ideas.length}
          open={open}
          onToggle={() => setOpen((current) => !current)}
        />

        <CollapsibleContent>
          <CardContent className="space-y-[var(--ref-spacing-xs)] px-[var(--ref-spacing-sm)] pb-[var(--ref-spacing-sm)] pt-[var(--ref-spacing-xxs)] md:px-[var(--ref-spacing-md)]">
            {source.status === "processing" ? (
              <div className="flex flex-col gap-[var(--ref-spacing-xs)] rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-electric-blue-20)] bg-[color:var(--ref-color-electric-blue-10)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)] md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-[var(--ref-spacing-xs)]">
                  <div className="mt-[var(--ref-spacing-xxxs)] flex size-9 items-center justify-center rounded-[var(--ref-radius-lg)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-electric-blue-150)]">
                    <LoaderCircle className="size-4 animate-spin" />
                  </div>
                  <div>
                    <p className="text-[length:var(--ref-font-size-sm)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-sm)] text-[color:var(--ref-color-grey-150)]">
                      Extraction still running
                    </p>
                    <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-md)] text-[color:var(--ref-color-grey-80)]">
                      New ideas will stream into this group as the PDF is processed. The layout already supports partial
                      results and follow-up extraction passes.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[var(--ref-radius-lg)] border-[color:var(--ref-color-electric-blue-20)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-electric-blue-150)] hover:bg-[color:var(--ref-color-white)]"
                >
                  Refresh status
                </Button>
              </div>
            ) : null}

            {source.status === "failed" ? (
              <div className="flex flex-col gap-[var(--ref-spacing-xs)] rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-red-20)] bg-[color:var(--ref-color-red-10)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)] md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-[var(--ref-spacing-xs)]">
                  <div className="mt-[var(--ref-spacing-xxxs)] flex size-9 items-center justify-center rounded-[var(--ref-radius-lg)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-red-150)]">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div>
                    <p className="text-[length:var(--ref-font-size-sm)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-sm)] text-[color:var(--ref-color-grey-150)]">
                      Extraction failed for this source
                    </p>
                    <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-md)] text-[color:var(--ref-color-grey-80)]">
                      Keep the source visible so the user can understand what failed, retry processing, or remove the
                      file without losing surrounding context.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[var(--ref-radius-lg)] border-[color:var(--ref-color-red-20)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-red-150)] hover:bg-[color:var(--ref-color-white)]"
                >
                  <WandSparkles className="size-4" />
                  Reprocess source
                </Button>
              </div>
            ) : null}

            <ExtractedIdeaList
              ideas={source.ideas}
              selectedIds={selectedIdeaIds}
              viewMode={viewMode}
              loading={source.status === "processing" && source.ideas.length === 0}
              onIdeaSelect={onIdeaSelect}
              onOpenIdea={onOpenIdea}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
