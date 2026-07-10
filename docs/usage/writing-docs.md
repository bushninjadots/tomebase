# Writing Docs

TomeBase uses Markdown for all content. The editor provides a split-pane experience with live preview, auto-save, and a formatting toolbar.

## Markdown Basics

| Element | Syntax |
|---------|--------|
| Heading | `## Heading` (level 2) |
| Bold | `**bold text**` |
| Italic | `*italic text*` |
| Code | `` `inline code` `` |
| Link | `[text](url)` |
| List | `- item` or `1. item` |

## Wiki Links

Link to other pages using double brackets: `[[Page Name]]`. Wiki links resolve in both the editor preview and published documentation. Type `[[` to trigger autocomplete with matching page titles.

## Callout Blocks

Use GitHub-style callouts to highlight content:

```
> [!note] Title
> Content here

> [!warning]
> Content here

> [!tip]
> Content here

> [!danger]
> Content here
```

Available callout types: `note`, `tip`, `warning`, `danger`, `info`, `success`, `question`, `example`, `quote`, `cite`, `todo`, `reference`.

## Page Templates

When creating a new page, choose from 9 templates:

- Blank Page
- Getting Started
- API Reference
- Troubleshooting Guide
- Release Notes
- Architecture Overview
- Configuration
- Database
- Authentication

Templates include pre-written sections and wiki links to related pages.

## Version History

Every save creates a snapshot. Click the clock icon in the editor toolbar to browse history, preview previous versions, restore content, or compare two versions side-by-side.

## Related

- [[page-organization|Page Organization]] — hierarchy, tags, backlinks
- [[getting-started|Getting Started]] — first project setup
