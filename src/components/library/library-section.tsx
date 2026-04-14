import * as React from "react";
import {
  ArrowUpDown,
  FileStack,
  Filter,
  ListFilter,
  PanelLeft,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LibrarySourceCard } from "./library-source-card";
import type { ExtractedIdea, LibrarySource, LibraryViewMode } from "./types";

export interface LibrarySectionProps {
  sources: LibrarySource[];
  initialViewMode?: LibraryViewMode;
  title?: string;
  description?: string;
  showSourceIndex?: boolean;
}

export function LibrarySection({
  sources,
  initialViewMode = "compact",
  title = "Library",
  description = "Extracted ideas stay grouped by source so teams can scan, act, and scale without losing context.",
  showSourceIndex = true,
}: LibrarySectionProps) {
  const [viewMode, setViewMode] = React.useState<LibraryViewMode>(initialViewMode);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeIdea, setActiveIdea] = React.useState<ExtractedIdea | null>(null);

  const allIdeas = React.useMemo(() => sources.flatMap((source) => source.ideas), [sources]);

  function handleIdeaSelect(ideaId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? Array.from(new Set([...current, ideaId])) : current.filter((id) => id !== ideaId),
    );
  }

  return (
    <section className="bg-[color:var(--background-bg)] px-[var(--ref-spacing-sm)] pb-[var(--ref-spacing-md)] pt-[var(--ref-spacing-sm)] text-[color:var(--ref-color-grey-100)] md:px-[var(--ref-spacing-md)] md:pb-[var(--ref-spacing-lg)] lg:px-[var(--ref-spacing-lg)]">
      <div className="mx-auto flex w-full max-w-7xl gap-[var(--ref-spacing-sm)] lg:gap-[var(--ref-spacing-md)]">
        {showSourceIndex && sources.length > 1 ? (
          <aside className="sticky top-[var(--ref-spacing-sm)] hidden h-fit w-64 shrink-0 lg:block">
            <Card className="rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] shadow-none">
              <CardHeader className="pb-[var(--ref-spacing-xxs)] pt-[var(--ref-spacing-sm)]">
                <CardTitle className="flex items-center gap-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-sm)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-sm)] text-[color:var(--ref-color-grey-150)]">
                  <PanelLeft className="size-4 text-[color:var(--ref-color-grey-60)]" />
                  Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-[var(--ref-spacing-xxs)] pb-[var(--ref-spacing-sm)] pt-0">
                {sources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    className="flex w-full items-start justify-between rounded-[var(--ref-radius-xl)] border border-transparent bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-xs)] py-[var(--ref-spacing-xxs)] text-left transition hover:border-[color:var(--ref-color-grey-20)] hover:bg-[color:var(--ref-color-white)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[length:var(--ref-font-size-sm)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-sm)] text-[color:var(--ref-color-grey-150)]">
                        {source.name}
                      </p>
                      <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-xs)] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                        {source.ideas.length} ideas
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-[var(--ref-radius-full)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)]"
                    >
                      {source.status}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1 space-y-[var(--ref-spacing-sm)]">
          <Card className="overflow-hidden rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] shadow-none">
            <CardContent className="space-y-[var(--ref-spacing-sm)] p-[var(--ref-spacing-sm)] md:p-[var(--ref-spacing-md)]">
              <div className="flex flex-col gap-[var(--ref-spacing-sm)] lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-[var(--ref-spacing-xxs)]">
                  <div className="inline-flex items-center gap-[var(--ref-spacing-xxs)] rounded-[var(--ref-radius-full)] border border-[color:var(--ref-color-orange-20)] bg-[color:var(--ref-color-orange-10)] px-[var(--ref-spacing-xxs)] py-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.08em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-orange-150)]">
                    <Sparkles className="size-3.5" />
                    Content idea bank
                  </div>
                  <div>
                    <h1 className="text-[length:var(--ref-font-size-xxl)] font-[var(--ref-font-weight-extra-bold)] leading-[var(--ref-font-line-height-xl)] text-[color:var(--ref-color-grey-150)]">
                      {title}
                    </h1>
                    <p className="mt-[var(--ref-spacing-xxs)] max-w-3xl text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-md)] text-[color:var(--ref-color-grey-80)]">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-[var(--ref-spacing-xxs)] sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)]">
                    <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                      Sources
                    </p>
                    <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-lg)] font-[var(--ref-font-weight-extra-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)]">
                      {sources.length}
                    </p>
                  </div>
                  <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)]">
                    <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                      Extracted ideas
                    </p>
                    <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-lg)] font-[var(--ref-font-weight-extra-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)]">
                      {allIdeas.length}
                    </p>
                  </div>
                  <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)]">
                    <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                      High relevance
                    </p>
                    <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-lg)] font-[var(--ref-font-weight-extra-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)]">
                      {allIdeas.filter((idea) => idea.priority === "high").length}
                    </p>
                  </div>
                  <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)]">
                    <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                      Selected
                    </p>
                    <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-lg)] font-[var(--ref-font-weight-extra-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)]">
                      {selectedIds.length}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-[color:var(--ref-color-grey-10)]" />

              <div className="flex flex-col gap-[var(--ref-spacing-xxs)] xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-[var(--ref-spacing-xs)] top-1/2 size-4 -translate-y-1/2 text-[color:var(--ref-color-grey-60)]" />
                  <Input
                    placeholder="Search sources, titles, or extracted themes..."
                    className="h-10 rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] pl-[calc(var(--ref-spacing-xl)+var(--ref-spacing-xxxs))] focus-visible:ring-[color:var(--ref-color-electric-blue-100)]"
                  />
                </div>

                <div className="flex flex-col gap-[var(--ref-spacing-xxs)] sm:flex-row sm:flex-wrap xl:justify-end">
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as LibraryViewMode)}>
                    <TabsList className="grid h-10 w-full grid-cols-2 rounded-[var(--ref-radius-xl)] bg-[color:var(--ref-color-grey-05)] p-[var(--ref-spacing-xxxs)] sm:w-[210px]">
                      <TabsTrigger value="compact" className="rounded-[var(--ref-radius-lg)]">
                        Compact
                      </TabsTrigger>
                      <TabsTrigger value="comfortable" className="rounded-[var(--ref-radius-lg)]">
                        Comfortable
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Button
                    variant="outline"
                    className="h-10 rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-grey-100)]"
                  >
                    <Filter className="size-4" />
                    Filter
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-grey-100)]"
                  >
                    <ArrowUpDown className="size-4" />
                    Sort ideas
                  </Button>
                </div>
              </div>

              {selectedIds.length > 0 ? (
                <div className="flex flex-col gap-[var(--ref-spacing-xs)] rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-electric-blue-20)] bg-[color:var(--ref-color-electric-blue-10)] px-[var(--ref-spacing-sm)] py-[var(--ref-spacing-xs)] md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[length:var(--ref-font-size-sm)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-sm)] text-[color:var(--ref-color-grey-150)]">
                      {selectedIds.length} ideas selected
                    </p>
                    <p className="mt-[var(--ref-spacing-xxxs)] text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-md)] text-[color:var(--ref-color-grey-80)]">
                      The layout already supports future bulk actions like generate, tag, move, or export without
                      changing the hierarchy.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-[var(--ref-spacing-xxs)]">
                    <Button
                      variant="secondary"
                      className="h-10 rounded-[var(--ref-radius-xl)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-electric-blue-150)] hover:bg-[color:var(--ref-color-white)]"
                    >
                      <Wand2 className="size-4" />
                      Generate from selected
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-10 rounded-[var(--ref-radius-xl)] text-[color:var(--ref-color-grey-100)] hover:bg-[color:var(--ref-color-white)]"
                      onClick={() => setSelectedIds([])}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {sources.length === 0 ? (
            <Card className="rounded-[var(--ref-radius-xl)] border-dashed border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] shadow-none">
              <CardContent className="flex flex-col items-center px-[var(--ref-spacing-md)] py-[var(--ref-spacing-xxl)] text-center">
                <div className="flex size-16 items-center justify-center rounded-[var(--ref-radius-xl)] bg-[color:var(--ref-color-grey-05)] text-[color:var(--ref-color-grey-60)]">
                  <FileStack className="size-7" />
                </div>
                <h2 className="mt-[var(--ref-spacing-sm)] text-[length:var(--ref-font-size-lg)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)]">
                  No sources in your library yet
                </h2>
                <p className="mt-[var(--ref-spacing-xxs)] max-w-lg text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-80)]">
                  Upload PDFs or paste URLs to build a structured idea bank. New sources can slot into this layout
                  without changing how people scan, compare, and act on extracted ideas.
                </p>
                <div className="mt-[var(--ref-spacing-md)] flex flex-wrap justify-center gap-[var(--ref-spacing-xs)]">
                  <Button className="h-10 rounded-[var(--ref-radius-xl)] bg-[color:var(--ref-color-orange-100)] text-[color:var(--ref-color-white)] hover:bg-[color:var(--ref-color-orange-150)]">
                    Upload PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-grey-100)]"
                  >
                    Import URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-[var(--ref-spacing-xs)]">
              {sources.map((source, index) => (
                <LibrarySourceCard
                  key={source.id}
                  source={source}
                  viewMode={viewMode}
                  defaultOpen={index === 0}
                  selectedIdeaIds={selectedIds}
                  onIdeaSelect={handleIdeaSelect}
                  onOpenIdea={setActiveIdea}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={Boolean(activeIdea)} onOpenChange={(open) => !open && setActiveIdea(null)}>
        <SheetContent className="w-full overflow-hidden border-l-[color:var(--ref-color-grey-20)] bg-[color:var(--background-bg)] sm:max-w-xl">
          {activeIdea ? (
            <>
              <SheetHeader className="space-y-[var(--ref-spacing-xs)] border-b border-[color:var(--ref-color-grey-20)] pb-[var(--ref-spacing-sm)]">
                <div className="flex items-center gap-[var(--ref-spacing-xxs)]">
                  <Badge className="rounded-[var(--ref-radius-full)] bg-[color:var(--ref-color-orange-10)] text-[color:var(--ref-color-orange-150)] hover:bg-[color:var(--ref-color-orange-10)]">
                    Idea detail
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-[var(--ref-radius-full)] border-[color:var(--ref-color-grey-20)]"
                  >
                    {activeIdea.priority} priority
                  </Badge>
                </div>
                <SheetTitle className="text-left text-[length:var(--ref-font-size-xl)] font-[var(--ref-font-weight-extra-bold)] leading-[var(--ref-font-line-height-xl)] text-[color:var(--ref-color-grey-150)]">
                  {activeIdea.title}
                </SheetTitle>
                <SheetDescription className="text-left text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-80)]">
                  This drawer gives each idea room for richer context, edits, generated drafts, and future collaboration
                  metadata without overloading the primary list view.
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-170px)] pr-[var(--ref-spacing-sm)]">
                <div className="space-y-[var(--ref-spacing-md)] py-[var(--ref-spacing-md)]">
                  <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-grey-05)] p-[var(--ref-spacing-sm)]">
                    <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                      Summary
                    </p>
                    <p className="mt-[var(--ref-spacing-xs)] text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-100)]">
                      {activeIdea.summary}
                    </p>
                  </div>

                  <div className="grid gap-[var(--ref-spacing-xs)] sm:grid-cols-2">
                    <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] p-[var(--ref-spacing-sm)]">
                      <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                        Confidence
                      </p>
                      <p className="mt-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-lg)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-150)]">
                        {Math.round(activeIdea.confidence * 100)}%
                      </p>
                    </div>
                    <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] p-[var(--ref-spacing-sm)]">
                      <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                        Next step
                      </p>
                      <p className="mt-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-sm)] font-[var(--ref-font-weight-bold)] leading-[var(--ref-font-line-height-md)] text-[color:var(--ref-color-grey-150)]">
                        Generate a post draft or ask a follow-up question
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[var(--ref-radius-xl)] border border-[color:var(--ref-color-grey-20)] p-[var(--ref-spacing-sm)]">
                    <p className="text-[length:var(--ref-font-size-xs)] font-[var(--ref-font-weight-bold)] uppercase tracking-[0.12em] leading-[var(--ref-font-line-height-xs)] text-[color:var(--ref-color-grey-60)]">
                      Future-ready panel space
                    </p>
                    <ul className="mt-[var(--ref-spacing-xs)] space-y-[var(--ref-spacing-xxs)] text-[length:var(--ref-font-size-sm)] leading-[var(--ref-font-line-height-lg)] text-[color:var(--ref-color-grey-80)]">
                      <li>Generated social post drafts</li>
                      <li>Linked source quotes or page references</li>
                      <li>Comments, ownership, and workflow status</li>
                      <li>Custom tags, campaign mapping, and publishing actions</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-[var(--ref-spacing-xs)]">
                    <Button className="h-10 rounded-[var(--ref-radius-xl)] bg-[color:var(--ref-color-orange-100)] text-[color:var(--ref-color-white)] hover:bg-[color:var(--ref-color-orange-150)]">
                      <Wand2 className="size-4" />
                      Generate post
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-[var(--ref-radius-xl)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-grey-100)]"
                    >
                      <ListFilter className="size-4" />
                      Ask a question
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
