export type SourceType = "pdf" | "url";
export type SourceStatus = "processed" | "processing" | "failed";
export type ExtractionStrength = "weak" | "moderate" | "strong";
export type IdeaPriority = "high" | "medium" | "low";
export type LibraryViewMode = "compact" | "comfortable";

export interface ExtractedIdea {
  id: string;
  title: string;
  summary: string;
  priority: IdeaPriority;
  confidence: number;
  selected?: boolean;
  pinned?: boolean;
}

export interface LibrarySource {
  id: string;
  name: string;
  sourceType: SourceType;
  importedAt: string;
  status: SourceStatus;
  extractionStrength?: ExtractionStrength;
  questionCount?: number;
  ideas: ExtractedIdea[];
}
