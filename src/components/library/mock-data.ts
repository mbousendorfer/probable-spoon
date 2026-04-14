import type { LibrarySource } from "./types";

export const singleSourceWithSixIdeas: LibrarySource = {
  id: "source-growth-guide",
  name: "B2B Social Growth Playbook Q2.pdf",
  sourceType: "pdf",
  importedAt: "Apr 1, 2026",
  status: "processed",
  extractionStrength: "strong",
  questionCount: 4,
  ideas: [
    {
      id: "idea-01",
      title: "Turn long-form reports into weekly audience proof points",
      summary:
        "The PDF repeatedly emphasizes how audience trust rises when brands publish one concrete learning per week instead of one massive campaign wrap-up at the end of the quarter.",
      priority: "high",
      confidence: 0.94,
      pinned: true,
    },
    {
      id: "idea-02",
      title: "Build a recurring 'what changed this month' content series",
      summary:
        "A strong pattern in the document is change tracking. The extracted idea is to create a lightweight monthly format that summarizes shifts in customer behavior, platform trends, or performance baselines.",
      priority: "high",
      confidence: 0.91,
    },
    {
      id: "idea-03",
      title: "Package customer interviews into opinion-led educational posts",
      summary:
        "Several sections advocate using customer language as the basis for educational content. This idea could support post generation, short carousels, and FAQ-style thought leadership.",
      priority: "medium",
      confidence: 0.83,
    },
    {
      id: "idea-04",
      title: "Create a benchmark post from underused performance tables",
      summary:
        "The extraction surfaced hidden benchmark material in appendix tables. Those tables can become punchy social content if reframed around one surprising comparison and one takeaway.",
      priority: "medium",
      confidence: 0.78,
    },
    {
      id: "idea-05",
      title: "Convert the framework chapter into a 5-part campaign arc",
      summary:
        "Rather than publishing one condensed summary, the system identified a sequential narrative structure that could map directly to a multi-post campaign with escalating depth.",
      priority: "low",
      confidence: 0.72,
    },
    {
      id: "idea-06",
      title: "Use the glossary as a fast evergreen content bank",
      summary:
        "The glossary section contains repeated niche terms with clear explanations, which makes it a good source for evergreen educational snippets or onboarding-oriented posts.",
      priority: "low",
      confidence: 0.68,
    },
  ],
};

export const multipleSourcesMock: LibrarySource[] = [
  singleSourceWithSixIdeas,
  {
    id: "source-ai-trends",
    name: "AI Buyer Signals Digest.pdf",
    sourceType: "pdf",
    importedAt: "Mar 28, 2026",
    status: "processing",
    extractionStrength: "moderate",
    ideas: [
      {
        id: "idea-07",
        title: "Publish a myth-vs-reality thread on AI buying readiness",
        summary:
          "Early extraction batches keep highlighting a gap between self-reported adoption and operational readiness, which can become a high-performing myth-busting format.",
        priority: "high",
        confidence: 0.86,
      },
    ],
  },
  {
    id: "source-newsletter",
    name: "Founder Newsletter Archive",
    sourceType: "url",
    importedAt: "Mar 22, 2026",
    status: "processed",
    extractionStrength: "moderate",
    ideas: [],
  },
  {
    id: "source-failed",
    name: "Partner Case Study Bundle.pdf",
    sourceType: "pdf",
    importedAt: "Mar 19, 2026",
    status: "failed",
    extractionStrength: "weak",
    ideas: [],
  },
];

export const loadingSourcesMock: LibrarySource[] = [
  {
    id: "source-loading",
    name: "Loading placeholder.pdf",
    sourceType: "pdf",
    importedAt: "Apr 3, 2026",
    status: "processing",
    extractionStrength: "moderate",
    ideas: [],
  },
];
