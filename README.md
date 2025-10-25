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
- 📑 **Smart Pagination**: Prevents orphaned headings at page bottoms (enabled by default)
- 📄 **Page Breaks**: Configurable automatic page breaks before headings (level 2 by default)
- ✂️ **Manual Page Breaks**: Insert page breaks anywhere using `<!-- pagebreak -->` comments
- 🎨 **Styled Code Blocks**: Automatically adds background color and styling to code blocks (enabled by default)
- 📏 **Heading Spacing**: Configurable whitespace before and after headings for better readability (2.5em before, 1.5em after by default)
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

#### Smart Title Detection

mdtype intelligently detects when your document has a single top-level heading (`#`) as a title. When detected:

- The level 1 heading is treated as an **unnumbered document title**
- Numbering starts at level 2 (`##`) as "1", "2", etc.
- Level 3 (`###`) becomes "1.1", "1.2", etc.

**Auto-detection criteria:**
- Exactly one `#` heading exists
- It's the first heading in the document

**Example with auto-detected title:**
```markdown
---
numbered_headings: true
---

# My Document Title
(unnumbered)

## Introduction
This becomes: 1 Introduction

## Methods
This becomes: 2 Methods

### Data Collection
This becomes: 2.1 Data Collection
```

**Manual override:**
```markdown
---
numbered_headings: true
treat_top_level_as_title: false  # Disable smart detection
---

# Chapter 1
This becomes: 1 Chapter 1

# Chapter 2
This becomes: 2 Chapter 2
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
  - When title detection is active, this counts levels *after* the title
  - Example: `toc_depth: 3` with a title shows levels 2, 3, and 4 (##, ###, ####)
- Position the `<!-- toc -->` marker anywhere in your document
- Works great with numbered headings!

**Note:** The TOC automatically adjusts when smart title detection is active, so `toc_depth: 3` always means "show 3 levels of content" regardless of whether level 1 is treated as a title.

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

## Pagination Control

mdtype automatically improves pagination by preventing orphaned headings—situations where a heading appears alone at the bottom of a page with its content on the next page.

### How It Works

By default, mdtype adds `#set block(sticky: true)` to your Typst output. This tells Typst to keep headings "stuck" to the content that follows them, ensuring they stay together on the same page.

### Disabling Orphan Prevention

If you need to disable this behavior for specific documents, you can do so via YAML frontmatter:

```markdown
---
prevent_heading_orphans: false
---

# Your Document Content
```

### What Gets Prevented

- ✅ Headings appearing alone at the bottom of a page
- ✅ Page breaks between headings and their first paragraph
- ✅ Better visual flow in multi-page documents

**Note**: This feature uses Typst's native sticky block behavior, which is the recommended approach for professional document typesetting.

## Page Breaks Before Headings

mdtype can automatically insert page breaks before headings at a specified level, making it easy to start new sections on fresh pages.

### Default Behavior

By default, page breaks are added before **level 2 headings** (`##`). This means each major section starts on a new page.

### Smart Consecutive Heading Detection

The page break logic is smart about consecutive headings:
- If a level 1 heading (`#`) is immediately followed by a level 2 heading (`##`), only **one** page break is inserted
- Prevents redundant blank pages between consecutive headings
- Uses Typst's `weak: true` page breaks to avoid breaks at the document start

### Configuration Options

Control page break behavior via YAML frontmatter:

```markdown
---
page_break_before_heading: 2  # Default: break before ## headings
---
```

**Available values:**
- `1` - Page breaks before level 1 headings (`#`)
- `2` - Page breaks before level 2 headings (`##`) - **default**
- `3` - Page breaks before level 3 headings (`###`)
- `false` - Disable automatic page breaks

### Examples

**Example 1: Default behavior (level 2)**
```markdown
# My Document Title

## Introduction
← New page starts here

## Methods
← New page starts here
```

**Example 2: Break before level 1**
```markdown
---
page_break_before_heading: 1
---

# Chapter 1
← New page

# Chapter 2
← New page
```

**Example 3: Disable page breaks**
```markdown
---
page_break_before_heading: false
---

## Section 1
## Section 2
← No automatic page breaks
```

### How It Works

mdtype generates a Typst show rule that:
1. Checks if there are any headings before the current one
2. Checks if the previous heading is on a different page
3. Only inserts a page break if needed (avoiding redundant breaks)

This ensures clean, professional pagination without manual intervention.

### Manual Page Breaks

In addition to automatic page breaks, you can insert manual page breaks anywhere in your document using the `<!-- pagebreak -->` HTML comment:

```markdown
## Section 1

Some content here.

<!-- pagebreak -->

## Section 2

This section starts on a new page.
```

**Features:**
- Insert page breaks at any location in your document
- Works independently of automatic page break settings
- Useful for fine-tuning document layout
- Uses Typst's `#pagebreak()` command

**Example:**
```markdown
# Report

## Executive Summary

Key findings and recommendations.

<!-- pagebreak -->

## Detailed Analysis

This section begins on a fresh page.
```

This gives you complete control over pagination when needed, while still benefiting from automatic page breaks for consistent structure.

## Code Block Styling

mdtype automatically styles code blocks to make them visually distinct from regular text, similar to how they appear in GitHub and other Markdown renderers.

### Default Styling

By default, code blocks receive:

- **Light gray background** - Makes code stand out from surrounding text
- **Padding/inset** - Adds spacing inside the code block for readability
- **Rounded corners** - Creates a modern, polished appearance
- **Inline code styling** - Inline `code` also gets subtle background highlighting

### Examples

**Block code:**
````markdown
```python
def hello():
    print("Hello, World!")
```
````

**Inline code:**
```markdown
Use the `print()` function to output text.
```

Both will have distinct gray backgrounds in the PDF output.

### Disabling Code Block Styling

If you prefer unstyled code blocks, you can disable this feature via YAML frontmatter:

```markdown
---
style_code_blocks: false
---

# Your Document Content
```

### Technical Details

mdtype uses Typst's `show raw` rules to apply styling:
- Block code: `#show raw.where(block: true): block.with(fill: luma(240), ...)`
- Inline code: `#show raw.where(block: false): box.with(fill: luma(240), ...)`

This ensures consistent, professional-looking code formatting throughout your documents.

## Heading Spacing

mdtype automatically adds comfortable whitespace before and after headings to improve visual hierarchy and document readability.

### Default Spacing

By default, headings have:
- **2.5em** of space above (before the heading)
- **1.5em** of space below (after the heading)

This creates clear visual separation between sections while keeping headings close to their content.

### Customizing Spacing

You can adjust spacing in several ways using YAML frontmatter:

**Simple format (affects "after" spacing only):**
```markdown
---
heading_spacing: "1em"
---
```

**Full control (before and after):**
```markdown
---
heading_spacing:
  before: "3em"
  after: "1em"
---
```

**Supported spacing units:**
- `em` - Relative to font size (e.g., `"1em"`, `"0.5em"`, `"2em"`)
- `pt` - Points (e.g., `"12pt"`, `"18pt"`)
- `cm` - Centimeters (e.g., `"0.5cm"`)
- `mm` - Millimeters (e.g., `"5mm"`)
- `in` - Inches (e.g., `"0.2in"`)

### Examples

**More spacing above headings:**
```markdown
---
heading_spacing:
  before: "4em"
  after: "1.5em"
---
```

**Compact layout:**
```markdown
---
heading_spacing:
  before: "1em"
  after: "0.5em"
---
```

**Only before spacing (no after):**
```markdown
---
heading_spacing:
  before: "2em"
  after: false
---
```

**Only after spacing (no before):**
```markdown
---
heading_spacing:
  before: false
  after: "1em"
---
```

**Disable all spacing:**
```markdown
---
heading_spacing: false
---
```

### Technical Details

mdtype uses Typst's `#show heading: set block(above: <spacing>, below: <spacing>)` rule to control spacing. This provides consistent, professional spacing throughout the document while remaining fully customizable.

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
