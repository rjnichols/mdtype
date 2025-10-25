# mdtype

Convert Markdown documents with Mermaid diagrams to beautifully typeset Typst format.

## Features

- ✨ **CommonMark & GFM Support**: Headings, lists, links, images, tables, task lists, strikethrough
- 📊 **Mermaid Diagrams**: Automatically renders mermaid diagrams to high-quality PNG images
- 🧮 **Math Equations**: Converts LaTeX-style math to Typst math syntax
- 🔢 **Numbered Headings**: Optional automatic heading numbering (1, 1.1, 1.1.1, etc.)
- 📚 **Table of Contents**: Generate TOC at any position in your document
- 📑 **Headers & Footers**: Configure custom headers/footers with page numbers, dates, and logos via YAML frontmatter
- 🔤 **Font Selection**: Choose between serif, sans-serif, or custom fonts via YAML frontmatter
- 📄 **Auto PDF Generation**: Specify `.pdf` output to automatically compile with Typst
- 🚀 **Simple CLI**: Easy-to-use command-line interface
- 🐳 **Docker Support**: Run in a containerized environment with all dependencies

## Installation

### Local Installation

```bash
npm install
npm run build
npm link  # Makes 'mdtype' available globally
```

### Docker

```bash
docker build -t mdtype .
```

## Usage

### Command Line

```bash
# Convert to Typst (auto-generated filename)
mdtype input.md

# Convert to Typst with custom name
mdtype input.md output.typ

# Convert directly to PDF (requires Typst installed)
mdtype input.md output.pdf

# Show help
mdtype --help
```

**Note**: When you specify a `.pdf` extension, mdtype will:
1. Generate the `.typ` file (same base name)
2. Automatically compile it to PDF using Typst
3. Requires Typst to be installed on your system

### Docker

```bash
# Convert a file (mounts current directory as /workspace)
docker run --rm -v $(pwd):/workspace mdtype input.md

# With custom Typst output
docker run --rm -v $(pwd):/workspace mdtype input.md output.typ

# Generate PDF directly (Typst included in Docker image!)
docker run --rm -v $(pwd):/workspace mdtype input.md output.pdf
```

**Note**: The Docker image includes both Chromium (for mermaid diagram rendering) and Typst (for PDF generation), so you can generate PDFs directly without any additional dependencies!

## Example

### Input Markdown

```markdown
# Project Architecture

This document describes the system architecture.

## Components

- **Frontend**: React application
- **Backend**: Node.js API
- **Database**: PostgreSQL

### System Diagram

\`\`\`mermaid
graph TD
    A[Frontend] --> B[API Gateway]
    B --> C[Backend Service]
    C --> D[Database]
\`\`\`

## Features

| Feature | Status | Priority |
|---------|--------|----------|
| Authentication | ✓ Done | High |
| Dashboard | In Progress | High |
| Reports | Planned | Medium |

### Mathematical Model

The response time is calculated as:

$$
T_{total} = T_{network} + T_{processing} + T_{database}
$$
```

### Output

The tool will generate:
- `output.typ` - Typst document with proper formatting
- `diagrams/mermaid-0.png` - Rendered mermaid diagram (high-quality PNG at 2x resolution)

## Supported Markdown Features

### Text Formatting
- **Bold** → `*bold*`
- _Italic_ → `_italic_`
- ~~Strikethrough~~ → `#strike[text]`
- `Inline code` → `` `code` ``

### Headings
```markdown
# Heading 1 → = Heading 1
## Heading 2 → == Heading 2
### Heading 3 → === Heading 3
```

### Lists
- Unordered lists → `- item`
- Ordered lists → `+ item`
- Task lists → Converted to regular lists

### Links & Images
- `[text](url)` → `#link("url")[text]`
- `![alt](image.png)` → `#figure(image("image.png"))`

### Tables
Converted to Typst `#table()` syntax with proper structure

### Code Blocks
Regular code blocks are preserved with syntax highlighting hints

### Math
- Inline math: `$x^2$` → `$x^2$`
- Display math: `$$E = mc^2$$` → `$ E = mc^2 $`
- Note: Typst requires multi-letter variables to use special syntax. For example, `mc` should be written as `m c` (with space) or `upright("mc")` in Typst

### Mermaid Diagrams
Automatically rendered to high-quality PNG images (2x resolution) and embedded as figures

## Numbered Headings and Table of Contents

### Numbered Headings

Enable automatic heading numbering by adding `numbered_headings: true` to your YAML frontmatter:

```markdown
---
numbered_headings: true
---

# Introduction
This becomes: 1 Introduction

## Getting Started
This becomes: 1.1 Getting Started

### Installation
This becomes: 1.1.1 Installation
```

### Table of Contents

Insert a table of contents anywhere in your document using the `<!-- toc -->` HTML comment:

```markdown
---
toc_depth: 3  # Optional: defaults to 3 (shows h1, h2, h3)
---

# My Document

This is the introduction.

<!-- toc -->

# Chapter 1
Content here...

## Section 1.1
More content...
```

The `<!-- toc -->` marker will be replaced with a Typst outline showing all headings up to the specified depth.

**Options:**
- `toc_depth`: Number of heading levels to include (default: 3)
- Position the `<!-- toc -->` marker anywhere in your document
- Works great with numbered headings!

### Example

See `examples/with-toc.md` for a complete example with numbered headings and table of contents.

## Headers and Footers

You can add custom headers and footers to your documents using YAML frontmatter:

```markdown
---
header:
  left: "Company Name"
  center: "Document Title"
  right: "{date:YYYY-MM-DD}"
footer:
  left: "Confidential"
  center: "Page {page} of {total-pages}"
  right: "© 2025"
---

# Your Document Content
```

### Available Placeholders

- **Page numbers**:
  - `{page}` - Current page number
  - `{total-pages}` - Total number of pages
- **Date/time**:
  - `{date}` - Current date (default: YYYY-MM-DD)
  - `{date:FORMAT}` - Custom format (e.g., `{date:DD/MM/YYYY}`)
- **Logos**:
  - `{logo:path/to/logo.png}` - Embed a logo image (default height: 1em)
  - `{logo:path/to/logo.png:2cm}` - Embed a logo with custom height (2cm)
  - `{logo:path/to/logo.png:3em}` - Embed a logo with custom height (3em)
  - Supported units: `em`, `pt`, `cm`, `mm`, `in`, `%`

### Example

See `examples/with-headers.md` for a complete example with all features.

## Font Selection

You can specify the font family for your document using YAML frontmatter:

```markdown
---
font: sans-serif
---

# Your Document Content
```

### Available Font Options

- **`serif`** - Typst's default serif font (New Computer Modern)
- **`sans-serif`** or **`sans`** - Sans-serif font (New Computer Modern Sans)
- **Custom font name** - Any font installed on your system (e.g., `"Arial"`, `"Times New Roman"`)

### Examples

```markdown
---
font: sans-serif
---
# Modern Sans-Serif Document
```

```markdown
---
font: serif
---
# Traditional Serif Document
```

```markdown
---
font: "Liberation Serif"
---
# Custom Font Document
```

**Note**: When using custom fonts, ensure they are installed on your system or available to Typst. The font name is passed directly to Typst's `#set text(font: "...")` command.

## Project Structure

```
mdtype/
├── src/
│   ├── cli.ts           # CLI entry point
│   ├── parser.ts        # Markdown parsing
│   ├── converter.ts     # Markdown → Typst conversion
│   └── mermaid.ts       # Mermaid → PNG rendering
├── dist/                # Compiled JavaScript (generated)
├── examples/            # Example markdown files
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Dependencies

- **unified/remark**: Markdown parsing ecosystem
- **remark-gfm**: GitHub Flavored Markdown support
- **remark-math**: Math equation support
- **@mermaid-js/mermaid-cli**: Mermaid diagram rendering
- **TypeScript**: Type-safe development

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
npm run dev input.md
```

## Docker Build Details

The Dockerfile:
- Uses Node.js 20 Alpine for small image size
- Installs Chromium (required by mermaid-cli for diagram rendering)
- Installs latest Typst (for PDF compilation)
- Multi-stage build for optimized production image
- Mounts `/workspace` for file I/O
- Includes all dependencies for complete Markdown → PDF conversion

## Limitations

- **Mermaid rendering**: Requires Chromium (downloaded automatically on first run by mermaid-cli)
- **Math syntax differences**: Typst has stricter math syntax than LaTeX. Multi-letter variables like `mc` in `E=mc^2` need to be written as `m c` (with space) or wrapped in `upright()`. You may need to manually adjust complex math equations in the generated `.typ` file.
- **Complex nested lists**: May need manual adjustment for proper formatting
- **HTML in markdown**: Ignored during conversion
- **Advanced GFM features**: Some features may have limited support

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
