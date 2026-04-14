import { MessageSquareText, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

export interface SourceActionsProps {
  compact?: boolean;
  className?: string;
}

export function SourceActions({ compact, className }: SourceActionsProps) {
  if (compact) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-9 rounded-[var(--ref-radius-lg)] border border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] text-[color:var(--ref-color-grey-80)] hover:bg-[color:var(--ref-color-grey-05)] hover:text-[color:var(--ref-color-grey-100)]",
                    className,
                  )}
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open source actions</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Source actions</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <MessageSquareText className="mr-2 size-4" />
            Ask a question
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Sparkles className="mr-2 size-4" />
            Extract more
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 size-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("hidden shrink-0 items-center justify-end gap-[var(--ref-spacing-xs)] md:flex", className)}>
      <div className="flex items-center gap-[var(--ref-spacing-xxs)]">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-[var(--ref-radius-lg)] border-[color:var(--ref-color-grey-20)] bg-[color:var(--ref-color-white)] px-[var(--ref-spacing-sm)] text-[color:var(--ref-color-grey-100)] hover:bg-[color:var(--ref-color-grey-05)]"
        >
          <MessageSquareText className="size-4" />
          Ask a question
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-8 rounded-[var(--ref-radius-lg)] bg-[color:var(--ref-color-orange-100)] px-[var(--ref-spacing-sm)] text-[color:var(--ref-color-white)] hover:bg-[color:var(--ref-color-orange-150)]"
        >
          <Sparkles className="size-4" />
          Extract more
        </Button>
      </div>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-[var(--ref-radius-lg)] text-[color:var(--ref-color-grey-60)] hover:bg-[color:var(--ref-color-grey-05)] hover:text-[color:var(--ref-color-grey-100)]"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open source actions</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Source actions</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <MessageSquareText className="mr-2 size-4" />
            Ask a question
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Sparkles className="mr-2 size-4" />
            Extract more
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 size-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
