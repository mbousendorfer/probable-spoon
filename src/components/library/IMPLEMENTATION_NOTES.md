# Library Redesign Notes

## Why this hierarchy works better

The redesign separates the interface into two strong levels:

1. **Source card**
   - Owns the file identity, status, import metadata, extraction strength, and source-level actions.
   - Supports collapse/expand so large libraries stay compact.
2. **Extracted idea list**
   - Lives directly under the source header so idea ownership is always obvious.
   - Uses denser idea units with title-first scanning, summary second, relevance third, and actions last.

This solves the original problem of a single oversized card filled with loose text rows. Users can now scan top-level sources first, then drill into ideas without losing context.

## How it scales

- **Filtering and sorting** can stay in the section toolbar because the source and idea levels are already modeled explicitly.
- **Bulk actions** are supported through idea checkboxes and the selected-ideas action bar.
- **Detail expansion** moves into a right-side sheet, which keeps the list compact while giving each idea room for richer context later.
- **Large libraries** can use the optional left-side source index for faster navigation.

## State coverage included

- Loaded
- Hover
- Selected idea
- Collapsed source
- Empty source ideas
- Empty whole library
- Processing
- Error
- Detail drawer
- Compact and comfortable density modes

## Integration note

This slice assumes a standard shadcn/ui setup with imports from `@/components/ui/*`, plus `clsx`, `tailwind-merge`, and `lucide-react`.
