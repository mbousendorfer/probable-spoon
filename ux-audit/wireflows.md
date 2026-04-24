# Archie UX Audit — Figma-Ready Wireflows

Use these as clean wireflow notation for the Figma rebuild.

## Core MVP Wireflows

### Project Start

```
[Dashboard · Projects]
↓ Create
[Session · New · Posts Empty]
↘ context choice ignored → [UX Gap]
↘ empty title accepted → [UX Gap]
```

### Open Existing Work

```
[Dashboard · Recent Sessions]
↓ Session Card
[Session Workspace]
├→ [Posts]
├→ [Content · By Source]
└→ [Context]
```

### Source Intake And Idea Extraction

```
[Session · Assistant Composer]
↓ Plus
[Attach Source Menu]
├→ [Add PDF]
├→ [Add Video]
└→ [Add URL]
↓
[Chat · Source Intake Turn]
↓
[Content · Processing Source Card]
↓ mock extraction delay
[Chat · Extracting Notice]
↓
[Chat · Extracted Ideas Result]
↓
[Content · Processed Source + New Ideas]
↘ unsupported kind → [Silent No-op]
```

### Assistant Prompt To Reply

```
[Session · Assistant Composer]
↓ Type or Suggested Prompt
[User Message]
↓
[Drafting Notice + Thinking Chip]
↓ mock delay
[Assistant Reply]
↘ empty input → [No-op]
```

### Review Extracted Idea

```
[Chat · Extracted Ideas Result]
↓ View Idea
[Session · Content · All Ideas]
↓
[Focused Idea Card]
↘ Helpful / Not helpful → [Visual Feedback Only]
```

### Content Review

```
[Session · Content]
├→ [By Source]
│   ├→ Ask → [Composer Prefilled With Source Prompt]
│   ├→ View All Ideas → [All Ideas]
│   └→ More → [No-op]
└→ [All Ideas]
    ├→ Search / Sort → [Filtered Ideas]
    ├→ Pin → [Visual Toggle Only]
    └→ Create Post From Idea → [No-op]
```

### Posts Review

```
[Session · Posts]
↓
[Post Filter Rail]
├→ All Posts
├→ Needs Fixes
├→ Scheduled
├→ LinkedIn
└→ X
↓
[Post Feed]
↘ no matches → [No Posts Match + Clear Filters]
↘ row actions → [No-op]
```

### Generate Post Image

```
[Post Card]
↓ Generate An Image
[Generate Image Modal · Prompt Deriving]
↓
[Generate Image Modal · Idle]
├→ Edit Prompt
├→ Pick Style
├→ Pick Mood
└→ Generate
↓
[Generate Image Modal · Loading]
↓
[Generate Image Modal · Result]
├→ Regenerate → [Loading]
├→ Edit Options → [Idle]
└→ Use This Image → [Modal Closes]
↘ no callback → [Image Not Applied]
```

## Context Wireflows

### Create Context

```
[Dashboard · Global Contexts]
↓ Create Context
[Analyse Hub]
↓ Name Context + Select Components
↓ Continue
┌───────────────────────────────┐
│ Selected stage sequence        │
│ Voice? → Brief? → Brand?       │
└───────────────────────────────┘
↓
[Context Summary]
├→ Back To Home → [Dashboard]
└→ Open Session With Context → [Seeded Acme Session · Context]
↘ no components selected → [Browser Alert]
```

### Voice Wizard

```
[Analyse Hub · Voice Selected]
↓
[Voice · Intake Question]
├→ No / Skip → [Dashboard]
└→ Yes
    ↓
    [Voice · Source Picker]
    ├→ Social Profile
    ├→ Document
    └→ Attached Sources
    ↓
    [Voice Section 1]
    ↓ good / rework / custom
    [Voice Section 2]
    ↓
    [...]
    ↓
    [Voice Summary]
    ├→ Looks Great → [Next Stage Or Summary]
    └→ Start Over → [Voice Section 1]
```

### Strategy Brief Wizard

```
[Analyse Hub · Brief Selected]
↓
[Brief · Goals]
↓ good / rework / custom
[Brief · Audience]
↓
[Brief · Brand Voice]
↓
[Brief Summary]
├→ Use As Default Toggle (Visual Only)
├→ Looks Great → [Next Stage Or Summary]
└→ Start Over → [Brief · Goals]
```

### Brand Theme Wizard

```
[Analyse Hub · Brand Selected]
↓
[Brand URL Input]
↓ Enter / Analyze Brand
[Brand Theme Preview]
├→ Start Over → [Brand URL Input]
└→ Apply This Theme
    ↓
    [Brand Confirmation]
    ├→ All Good → [Next Stage Or Summary]
    └→ Try Another URL → [Brand URL Input]
```

### Session Context Management

```
[Session · Context · No Context]
├→ Create Context → [Analyse Hub]
└→ Attach Existing → [Session · Context · Populated Demo]

[Session · Context · Attached]
├→ Voice Accordion
├→ Brief Accordion
├→ Brand Accordion
├→ Edit → [Analyse Hub · Edit Mode]
└→ Detach → [Context Query Cleared]
   ↘ real seeded session → [Still Attached]
```

## Support And Utility Wireflows

### Give Feedback

```
[Topbar]
↓ Give Feedback
[Feedback Modal]
↓ Select Feature Area
↓ Type Feedback
↓ Send
[Sending State]
↓
[Success State]
↓ auto-close
[Previous Screen]
↘ empty feedback → [Invalid Textarea]
```

### Report Bug

```
[Topbar]
↓ Report A Bug
[Bug Report Modal]
↓ Auto-Capture Screenshot
├→ Category Chip
├→ Attempted Action
├→ Required Problem
└→ Screenshot Upload / Remove
↓ Submit
[Submitting State]
↓
[Success State]
↓ auto-close
[Previous Screen]
↘ empty problem → [Invalid Textarea]
↘ capture fails → [Manual Upload Fallback]
```

### Prototype Mode Switch

```
[Admin Chip]
↓ Click
[localStorage archie-user-mode toggled]
↓ Reload
[Dashboard Variant]
├→ First-Time User
└→ Returning User
```

## Broken / Partial Wireflows

```
[Dashboard · Template Starter]
↓ click
[No-op]
```

```
[Dashboard · Add Source]
↓ click
[No-op]
```

```
[Idea Card · Create Post From This Idea]
↓ click
[No-op]
```

```
[Post Action Rail]
├→ Edit
├→ Rewrite With AI
├→ Schedule
├→ Duplicate
└→ Delete
↓
[No-op]
```

```
[Topbar · Settings]
↓ click
[No-op]
```
