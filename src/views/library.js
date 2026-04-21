import { store, getActiveSession, countIdeas, countPinnedIdeas } from "../store.js?v=15";
import {
  escapeHtml,
  icons,
  actionButton,
  iconButton,
  overflowMenu,
  statusPill,
  priorityPill,
  strengthPill,
  iconForType,
  generationPlatformCopy,
} from "../utils.js?v=17";
import { renderPlatformSelector } from "./posts.js?v=18";

export function renderEmptyIdeas(sessionName) {
  return (
    '<div class="inline-empty-state"><div class="icon">' +
    icons.filePdf +
    '</div><h4 style="margin-top: 14px; color: var(--ref-color-grey-150)">No ideas extracted yet</h4><p>' +
    escapeHtml(sessionName) +
    " has this source attached, but there are no extracted ideas yet. Run another extraction pass or ask a focused question to deepen the output.</p></div>"
  );
}

export function renderSourceCard(source, ui, sessionName) {
  const open = ui.openSourceIds.includes(source.id);
  const platformCopy = generationPlatformCopy(ui.generationPlatform);
  const ideasHtml =
    source.ideas.length === 0
      ? renderEmptyIdeas(sessionName)
      : source.ideas
          .map((idea) => {
            const selected = ui.selectedIdeaIds.includes(idea.id);
            const pendingAction = ui.pendingIdeaActions[idea.id] || "";
            return (
              '<article class="idea-item ' +
              (selected ? "selected" : "") +
              '"><div class="idea-top"><label class="ap-checkbox-container idea-select" aria-label="Select idea"><input type="checkbox" data-idea-select="' +
              idea.id +
              '" ' +
              (selected ? "checked" : "") +
              ' /><i></i></label><div class="idea-main"><div class="idea-header"><div class="idea-meta-row">' +
              priorityPill(idea.priority) +
              '<span class="idea-confidence">' +
              icons.sparkles +
              " " +
              idea.confidence +
              "% confidence</span>" +
              (idea.pinned ? '<span class="ap-status yellow no-dot">' + icons.pin + "Pinned</span>" : "") +
              '</div><div class="idea-actions">' +
              actionButton({
                style: "secondary",
                color: "blue",
                label: pendingAction === "generate" ? "Generating..." : "Generate " + platformCopy.shortLabel,
                attrs: 'data-generate-post="' + idea.id + '"',
                loading: pendingAction === "generate",
                disabled: pendingAction === "generate",
              }) +
              overflowMenu({
                label: "Idea actions",
                triggerClass: "ap-icon-button stroked",
                items: [
                  '<button type="button" class="action-menu-item" data-open-idea="' +
                    idea.id +
                    '">Open details</button>',
                  '<button type="button" class="action-menu-item" data-ask-idea="' +
                    idea.id +
                    '">Ask about this idea</button>',
                  '<button type="button" class="action-menu-item" data-draft-idea="' +
                    idea.id +
                    '">Draft post</button>',
                  '<button type="button" class="action-menu-item" data-compare-idea="' +
                    idea.id +
                    '">' +
                    (pendingAction === "compare" ? "Comparing..." : "Compare") +
                    "</button>",
                  '<button type="button" class="action-menu-item" data-pin-idea="' +
                    idea.id +
                    '">' +
                    (idea.pinned ? "Unpin idea" : "Pin idea") +
                    "</button>",
                ],
              }) +
              '</div></div><button type="button" class="idea-content-button" data-open-idea="' +
              idea.id +
              '"><h4>' +
              escapeHtml(idea.title) +
              '</h4><p class="idea-summary">' +
              escapeHtml(idea.summary) +
              "</p></button></div></div></article>"
            );
          })
          .join("");

  const bodyHtml = open
    ? '<div class="source-body">' +
      (source.status === "processing"
        ? '<div class="ap-infobox info has-title"><i class="ap-icon-info_fill"></i><div class="ap-infobox-content"><div class="ap-infobox-texts"><span class="ap-infobox-title">Extraction still running</span><span class="ap-infobox-message">New ideas will stream into this source as processing completes.</span></div>' +
          actionButton({ style: "stroked", color: "grey", label: "Refresh status" }) +
          "</div></div>"
        : "") +
      (source.status === "failed"
        ? '<div class="ap-infobox error has-title"><i class="ap-icon-error_fill"></i><div class="ap-infobox-content"><div class="ap-infobox-texts"><span class="ap-infobox-title">Extraction failed for this source</span><span class="ap-infobox-message">Retry the extraction or remove the source without losing the rest of the session context.</span></div>' +
          actionButton({ style: "secondary", color: "orange", label: "Reprocess source" }) +
          "</div></div>"
        : "") +
      '<div class="idea-intro"><div><h4>Extracted ideas</h4><p>Select the strongest ideas, compare them, or draft a post without losing source context.</p></div><div class="idea-review-meta">' +
      icons.sparkles +
      " " +
      source.ideas.length +
      ' ready to review</div></div><div class="idea-list">' +
      ideasHtml +
      "</div></div>"
    : "";

  return (
    '<section class="source-card ' +
    (open ? "" : "collapsed") +
    '"><div class="source-header"><div class="source-left"><div class="source-icon">' +
    iconForType(source.type) +
    '</div><div class="source-copy"><div class="source-kicker">' +
    escapeHtml(source.type === "url" ? "URL source" : "PDF source") +
    '</div><div class="source-title-row"><div class="source-title">' +
    escapeHtml(source.name) +
    "</div>" +
    statusPill(source.status) +
    '</div><div class="source-meta-row"><span>Imported ' +
    escapeHtml(source.importedAt) +
    '</span><span class="source-meta-divider">·</span><span>' +
    source.ideas.length +
    ' extracted ideas</span><span class="source-meta-divider">·</span>' +
    strengthPill(source.strength) +
    '</div></div></div><div class="source-actions">' +
    actionButton({ style: "stroked", color: "blue", label: "Ask a question" }) +
    actionButton({ style: "primary", color: "orange", label: "Extract more" }) +
    iconButton({
      label: open ? "Collapse source" : "Expand source",
      icon: open ? icons.chevronUp : icons.chevronDown,
      attrs: 'data-toggle-source="' + source.id + '"',
      stroked: true,
    }) +
    "</div></div>" +
    bodyHtml +
    "</section>"
  );
}

export function renderSelectionBar(ui) {
  if (!ui.selectedIdeaIds.length) return "";
  const platformCopy = generationPlatformCopy(ui.generationPlatform);
  return (
    '<div class="selection-bar visible"><div><h4>' +
    ui.selectedIdeaIds.length +
    ' ideas selected</h4><p class="lead" style="margin-top: 6px; max-width: none; font-size: 14px">Selection stays global for the session, so you can compare, chat, and generate drafts without losing your place.</p></div><div class="button-row">' +
    actionButton({
      style: "primary",
      color: "orange",
      label: "Generate " + platformCopy.shortLabel + " drafts",
      attrs: 'data-generate-selected="true"',
    }) +
    actionButton({
      style: "ghost",
      color: "grey",
      label: "Clear selection",
      attrs: 'data-clear-selection="true"',
    }) +
    "</div></div>"
  );
}

export function renderLibraryView(session, ui) {
  const normalizedQuery = ui.query.trim().toLowerCase();
  const filteredSources = normalizedQuery
    ? session.sources
        .map((source) => {
          const sourceMatch = source.name.toLowerCase().includes(normalizedQuery);
          const ideas = source.ideas.filter(
            (idea) =>
              idea.title.toLowerCase().includes(normalizedQuery) ||
              idea.summary.toLowerCase().includes(normalizedQuery),
          );
          return sourceMatch ? source : { ...source, ideas };
        })
        .filter((source) => source.name.toLowerCase().includes(normalizedQuery) || source.ideas.length > 0)
    : session.sources;

  return (
    '<section class="tab-panel"><section class="library-overview"><div class="session-overview"><div class="session-overview__copy"><div class="library-overview__eyebrow">Session library</div><div class="library-overview__title">Library</div><div class="library-overview__description">Sources and extracted ideas for <strong>' +
    escapeHtml(session.name) +
    '</strong>. Switch sessions from the sidebar to swap the whole working context.</div></div><div class="library-overview__meta"><span>' +
    session.sources.length +
    " sources</span> · <span>" +
    countIdeas(session) +
    " ideas</span> · <span>" +
    countPinnedIdeas(session) +
    " pinned</span></div></div></section>" +
    (session.sources.length
      ? '<div class="toolbar"><div class="toolbar-left"><div class="ap-form-field search"><div class="ap-input-group"><i class="ap-icon-search"></i><input type="text" id="searchInput" placeholder="Search sources, ideas, or extracted themes..." value="' +
        escapeHtml(ui.query) +
        '" /></div></div>' +
        renderPlatformSelector(ui) +
        "</div></div>"
      : "") +
    renderSelectionBar(ui) +
    '<section class="library-content">' +
    (session.sources.length === 0
      ? '<div class="session-empty"><div class="session-empty__hero"><div class="session-empty__icon">' +
        icons.upload +
        '</div><h3 style="color: var(--ref-color-grey-150)">No sources in ' +
        escapeHtml(session.name) +
        '</h3><p style="max-width: 620px; color: var(--ref-color-grey-80)">Upload a PDF, paste a URL, or drop in supporting material to start building the session library. Everything extracted here stays scoped to this session.</p>' +
        actionButton({ style: "primary", color: "orange", label: "Upload first source" }) +
        "</div></div>"
      : filteredSources.length === 0
        ? '<div class="empty-state"><div class="icon">' +
          icons.search +
          '</div><h3 style="margin-top: 18px; color: var(--ref-color-grey-150)">No matching sources or ideas</h3><p>Try another keyword or clear the search to view the full library for this session.</p></div>'
        : '<div class="sources">' +
          filteredSources.map((source) => renderSourceCard(source, ui, session.name)).join("") +
          "</div>") +
    "</section></section>"
  );
}
