import { LibrarySection } from "./library-section";
import { loadingSourcesMock, multipleSourcesMock, singleSourceWithSixIdeas } from "./mock-data";

export function LibrarySectionDemo() {
  return (
    <div className="space-y-10">
      <LibrarySection sources={[singleSourceWithSixIdeas]} showSourceIndex={false} />

      <LibrarySection
        title="Library states"
        description="A second pass showing the same information architecture under multiple source conditions: processing, empty, and failed."
        sources={multipleSourcesMock}
      />

      <LibrarySection
        title="Loading state"
        description="A processing-first state where a source exists before ideas are fully available."
        sources={loadingSourcesMock}
        showSourceIndex={false}
      />

      <LibrarySection
        title="Empty library"
        description="A calm empty state that still explains the model clearly: sources first, ideas second."
        sources={[]}
        showSourceIndex={false}
      />
    </div>
  );
}
