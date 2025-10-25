import { visit } from 'unist-util-visit';
import { relative, join, basename } from 'path';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import type { Root, Content, PhrasingContent, ListItem, TableRow, TableCell, Code } from 'mdast';
import type { RenderedDiagram } from './mermaid';
import type { DocumentConfig } from './parser';

// Math node types from remark-math
interface InlineMath {
  type: 'inlineMath';
  value: string;
}

interface Math {
  type: 'math';
  value: string;
}

export interface ConversionOptions {
  outputPath: string;
  diagrams: RenderedDiagram[];
  config?: DocumentConfig;
  sourceDir: string;
}

/**
 * Convert inline markdown formatting to Typst syntax
 */
function convertInlineMarkdown(text: string): string {
  // Strategy: We need to handle bold before italic to avoid conflicts
  // 1. Convert **bold** to a temporary placeholder
  // 2. Convert *italic* to _italic_
  // 3. Convert placeholder back to *bold*

  // Step 1: Convert **bold** to temporary placeholder
  const boldPlaceholder = '\x00BOLD\x00';
  const boldMatches: string[] = [];
  text = text.replace(/\*\*(.+?)\*\*/g, (match, content) => {
    boldMatches.push(content);
    return `${boldPlaceholder}${boldMatches.length - 1}${boldPlaceholder}`;
  });

  // Step 2: Convert *italic* to _italic_ (now safe, no double asterisks left)
  text = text.replace(/\*(.+?)\*/g, '_$1_');

  // Step 3: Convert placeholders back to *bold*
  text = text.replace(new RegExp(`${boldPlaceholder}(\\d+)${boldPlaceholder}`, 'g'), (match, index) => {
    return `*${boldMatches[parseInt(index)]}*`;
  });

  // Note: _italic_ is already correct Typst syntax, no need to convert

  return text;
}

/**
 * Process placeholder strings in header/footer content
 */
function processPlaceholder(text: string, outputPath: string, sourceDir: string): string {
  // Convert inline markdown formatting to Typst syntax first
  text = convertInlineMarkdown(text);

  // Check if we need context wrapper (for page counters)
  const needsContext = text.includes('{page}') || text.includes('{total-pages}');

  // Handle {page} - current page number
  if (text.includes('{page}')) {
    text = text.replace(/{page}/g, '#counter(page).display()');
  }

  // Handle {total-pages} - total number of pages
  if (text.includes('{total-pages}')) {
    text = text.replace(/{total-pages}/g, '#counter(page).final().last()');
  }

  // Handle {date} or {date:FORMAT} - current date
  const dateMatch = text.match(/{date(?::([^}]+))?}/g);
  if (dateMatch) {
    dateMatch.forEach(match => {
      const formatMatch = match.match(/{date:([^}]+)}/);
      if (formatMatch) {
        // Custom format - convert common patterns to Typst format
        let format = formatMatch[1];
        format = format.replace(/YYYY/g, '[year]');
        format = format.replace(/MM/g, '[month]');
        format = format.replace(/DD/g, '[day]');
        text = text.replace(match, `#datetime.today().display("${format}")`);
      } else {
        // Default format
        text = text.replace(match, '#datetime.today().display("[year]-[month]-[day]")');
      }
    });
  }

  // Handle {logo:path} or {logo:path:height} - image logo
  const logoMatch = text.match(/{logo:([^}]+)}/g);
  if (logoMatch) {
    logoMatch.forEach(match => {
      const pathMatch = match.match(/{logo:([^:}]+)(?::([^}]+))?}/);
      if (pathMatch) {
        const logoPath = pathMatch[1];
        const logoHeight = pathMatch[2] || '1em';  // Default to 1em if not specified
        // Copy logo to diagrams directory
        const diagramDir = join(outputPath, 'diagrams');
        const logoBasename = basename(logoPath);
        const destPath = join(diagramDir, logoBasename);
        const srcPath = join(sourceDir, logoPath);

        // Schedule logo copy (will be done async, but Typst will reference it)
        if (existsSync(srcPath)) {
          mkdir(diagramDir, { recursive: true }).then(() => {
            copyFile(srcPath, destPath).catch(err => {
              console.warn(`Failed to copy logo ${logoPath}:`, err.message);
            });
          });
        }

        const relativePath = relative(outputPath, destPath).replace(/\\/g, '/');
        text = text.replace(match, `#image("${relativePath}", height: ${logoHeight})`);
      }
    });
  }

  // Wrap in context if needed (for page counters)
  if (needsContext) {
    return `context [${text}]`;
  }

  return text;
}

/**
 * Generate Typst page setup with headers and footers
 */
function generatePageSetup(config: DocumentConfig, outputPath: string, sourceDir: string): string {
  if (!config.header && !config.footer) {
    return '';
  }

  let setup = '#set page(\n';

  // Generate header
  if (config.header && (config.header.left || config.header.center || config.header.right)) {
    const left = config.header.left ? processPlaceholder(config.header.left, outputPath, sourceDir) : '';
    const center = config.header.center ? processPlaceholder(config.header.center, outputPath, sourceDir) : '';
    const right = config.header.right ? processPlaceholder(config.header.right, outputPath, sourceDir) : '';

    setup += '  header: grid(\n';
    setup += '    columns: (1fr, 1fr, 1fr),\n';
    setup += '    align: (left + horizon, center + horizon, right + horizon),\n';
    // Don't wrap in brackets if already a context expression
    setup += `    ${left.startsWith('context') ? left : `[${left}]`},\n`;
    setup += `    ${center.startsWith('context') ? center : `[${center}]`},\n`;
    setup += `    ${right.startsWith('context') ? right : `[${right}]`}\n`;
    setup += '  ),\n';
  }

  // Generate footer
  if (config.footer && (config.footer.left || config.footer.center || config.footer.right)) {
    const left = config.footer.left ? processPlaceholder(config.footer.left, outputPath, sourceDir) : '';
    const center = config.footer.center ? processPlaceholder(config.footer.center, outputPath, sourceDir) : '';
    const right = config.footer.right ? processPlaceholder(config.footer.right, outputPath, sourceDir) : '';

    setup += '  footer: grid(\n';
    setup += '    columns: (1fr, 1fr, 1fr),\n';
    setup += '    align: (left + horizon, center + horizon, right + horizon),\n';
    // Don't wrap in brackets if already a context expression
    setup += `    ${left.startsWith('context') ? left : `[${left}]`},\n`;
    setup += `    ${center.startsWith('context') ? center : `[${center}]`},\n`;
    setup += `    ${right.startsWith('context') ? right : `[${right}]`}\n`;
    setup += '  )\n';
  }

  setup += ')\n\n';
  return setup;
}

/**
 * Generate Typst font setup
 */
function generateFontSetup(config: DocumentConfig): string {
  if (!config.font) {
    return '';
  }

  let fontName: string;

  // Map common font aliases to Typst font names
  switch (config.font.toLowerCase()) {
    case 'serif':
      fontName = 'New Computer Modern';
      break;
    case 'sans-serif':
    case 'sans':
      fontName = 'New Computer Modern Sans';
      break;
    default:
      // Use custom font name as-is
      fontName = config.font;
  }

  return `#set text(font: "${fontName}")\n\n`;
}

/**
 * Generate Typst pagination setup
 */
function generatePaginationSetup(config: DocumentConfig): string {
  // Default to preventing heading orphans unless explicitly disabled
  const preventOrphans = config.prevent_heading_orphans !== false;

  if (!preventOrphans) {
    return '';
  }

  // Set block sticky behavior to keep headings with following content
  return '#set block(sticky: true)\n\n';
}


/**
 * Generate Typst code block styling
 */
function generateCodeBlockStyling(config: DocumentConfig): string {
  // Default to styling code blocks unless explicitly disabled
  const styleCodeBlocks = config.style_code_blocks !== false;

  if (!styleCodeBlocks) {
    return '';
  }

  let output = '';

  // Style block code blocks (``` ```)
  output += '#show raw.where(block: true): block.with(\n';
  output += '  fill: luma(240),\n';
  output += '  inset: 10pt,\n';
  output += '  radius: 4pt,\n';
  output += ')\n\n';

  // Style inline code (`code`)
  output += '#show raw.where(block: false): box.with(\n';
  output += '  fill: luma(240),\n';
  output += '  inset: (x: 3pt, y: 0pt),\n';
  output += '  outset: (y: 3pt),\n';
  output += '  radius: 2pt,\n';
  output += ')\n\n';

  return output;
}

/**
 * Generate Typst heading spacing
 */
function generateHeadingSpacing(config: DocumentConfig): string {
  const spacingConfig = config.heading_spacing;

  // If explicitly set to false, don't add spacing
  if (spacingConfig === false) {
    return '';
  }

  let beforeSpacing: string | false;
  let afterSpacing: string | false;

  // Handle different config formats
  if (spacingConfig === undefined) {
    // Default: 2.5em before, 1.5em after
    beforeSpacing = '2.5em';
    afterSpacing = '1.5em';
  } else if (typeof spacingConfig === 'string') {
    // Legacy format: string applies to "after" only, before is default
    beforeSpacing = '2.5em';
    afterSpacing = spacingConfig;
  } else if (typeof spacingConfig === 'object') {
    // New format: explicit before/after
    beforeSpacing = spacingConfig.before === undefined ? '2.5em' : spacingConfig.before;
    afterSpacing = spacingConfig.after === undefined ? '1.5em' : spacingConfig.after;
  } else {
    // Fallback
    beforeSpacing = '2.5em';
    afterSpacing = '1.5em';
  }

  // Build the spacing parameters
  const params: string[] = [];
  if (beforeSpacing !== false) {
    params.push(`above: ${beforeSpacing}`);
  }
  if (afterSpacing !== false) {
    params.push(`below: ${afterSpacing}`);
  }

  // If no spacing is configured, return empty
  if (params.length === 0) {
    return '';
  }

  return `#show heading: set block(${params.join(', ')})\n\n`;
}

/**
 * Convert markdown AST to Typst format
 */
export function convertToTypst(ast: Root, options: ConversionOptions): string {
  let output = '';
  const { diagrams, outputPath, config, sourceDir } = options;

  // Create a map for quick diagram lookup
  const diagramMap = new Map(diagrams.map(d => [d.id, d.imagePath]));
  let diagramIndex = 0;

  // Track previous element for page break logic
  let previousWasHeading = false;
  const breakLevel = config?.page_break_before_heading ?? 2;
  const pageBreaksEnabled = breakLevel !== false;

  function processNode(node: Content): string {
    switch (node.type) {
      case 'heading':
        let pageBreak = '';

        // Determine if we should insert a page break before this heading
        if (pageBreaksEnabled && typeof breakLevel === 'number') {
          // Only consider page breaks for headings at or above the break level
          if (node.depth <= breakLevel) {
            // Insert break if the previous element was NOT a heading
            // This means the first heading in a consecutive sequence gets the break
            if (!previousWasHeading) {
              pageBreak = '#pagebreak(weak: true)\n';
            }
          }
        }

        // Update tracking - current element is a heading
        previousWasHeading = true;

        // Check if this is a level 1 heading that should be treated as title
        if (node.depth === 1 && config?.treat_top_level_as_title) {
          // Use explicit heading() function with outlined: false to exclude from TOC
          const headingText = processChildren(node.children);
          return `${pageBreak}#heading(level: 1, outlined: false)[${headingText}]\n\n`;
        }

        // Standard heading using = syntax
        const prefix = '='.repeat(node.depth);
        return `${pageBreak}${prefix} ${processChildren(node.children)}\n\n`;

      case 'paragraph':
        previousWasHeading = false;
        return `${processChildren(node.children)}\n\n`;

      case 'text':
        return escapeTypst(node.value);

      case 'emphasis':
        return `_${processChildren(node.children)}_`;

      case 'strong':
        return `*${processChildren(node.children)}*`;

      case 'delete':
        return `#strike[${processChildren(node.children)}]`;

      case 'inlineCode':
        return `\`${node.value}\``;

      case 'code':
        previousWasHeading = false;
        if (node.lang === 'mermaid') {
          // Replace mermaid block with image reference (PNG for better Typst compatibility)
          const diagram = diagrams[diagramIndex++];
          if (diagram) {
            const relativePath = relative(outputPath, diagram.imagePath).replace(/\\/g, '/');
            return `#figure(\n  image("${relativePath}", width: 80%),\n)\n\n`;
          }
          return '';
        }
        const lang = node.lang ? node.lang : '';
        return `\`\`\`${lang}\n${node.value}\n\`\`\`\n\n`;

      case 'link':
        return `#link("${node.url}")[${processChildren(node.children)}]`;

      case 'image':
        previousWasHeading = false;
        const alt = node.alt || '';
        return `#figure(\n  image("${node.url}"),\n  caption: [${alt}]\n)\n\n`;

      case 'list':
        previousWasHeading = false;
        return processList(node);

      case 'listItem':
        return processListItem(node);

      case 'blockquote':
        previousWasHeading = false;
        const content = processChildren(node.children);
        return `#quote[\n${content}]\n\n`;

      case 'table':
        previousWasHeading = false;
        return processTable(node);

      case 'thematicBreak':
        previousWasHeading = false;
        return `#line(length: 100%)\n\n`;

      case 'break':
        return ' \\\n';

      case 'html':
        // Check for TOC marker: <!-- toc -->
        if (node.value.trim() === '<!-- toc -->') {
          let tocDepth = config?.toc_depth ?? 3;

          // If treating top level as title, add 1 to depth
          // because level 1 is the title and user's depth refers to content levels
          if (config?.treat_top_level_as_title) {
            tocDepth += 1;
          }

          return `#outline(depth: ${tocDepth})\n\n`;
        }
        // Check for page break marker: <!-- pagebreak -->
        if (node.value.trim() === '<!-- pagebreak -->') {
          return `#pagebreak()\n\n`;
        }
        // Skip other HTML
        return '';

      case 'inlineMath':
        return `$${(node as InlineMath).value}$`;

      case 'math':
        return `$ ${(node as Math).value} $\n\n`;

      default:
        return '';
    }
  }

  function processChildren(children: PhrasingContent[] | Content[]): string {
    return children.map(child => processNode(child as Content)).join('');
  }

  function processList(node: any): string {
    const ordered = node.ordered;
    const items = node.children.map((item: ListItem, index: number) => {
      const marker = ordered ? '+' : '-';
      const content = processListItem(item);
      return `${marker} ${content}`;
    }).join('');
    return `${items}\n`;
  }

  function processListItem(node: ListItem): string {
    let result = '';
    for (const child of node.children) {
      if (child.type === 'paragraph') {
        result += processChildren(child.children);
      } else if (child.type === 'list') {
        result += '\n' + processList(child);
      } else {
        result += processNode(child as Content);
      }
    }
    return result.trim() + '\n';
  }

  function processTable(node: any): string {
    const rows = node.children as TableRow[];
    if (rows.length === 0) return '';

    const headerRow = rows[0];
    const bodyRows = rows.slice(1);

    const columns = headerRow.children.length;

    let table = '#figure(\n  table(\n';
    table += `    columns: ${columns},\n`;

    // Add header
    headerRow.children.forEach((cell: TableCell) => {
      const content = processChildren(cell.children);
      table += `    [*${content.trim()}*],\n`;
    });

    // Add body rows
    bodyRows.forEach((row: TableRow) => {
      row.children.forEach((cell: TableCell) => {
        const content = processChildren(cell.children);
        table += `    [${content.trim()}],\n`;
      });
    });

    table += '  )\n)\n\n';
    return table;
  }

  function escapeTypst(text: string): string {
    // Escape special Typst characters
    // Dollar signs need to be escaped as they trigger math mode
    text = text.replace(/\$/g, '\\$');
    // At signs need to be escaped as they trigger label references
    text = text.replace(/@/g, '\\@');
    return text;
  }

  // Generate page setup if config provided
  if (config) {
    // Add font setup first (before page setup)
    output += generateFontSetup(config);

    // Add pagination setup (sticky blocks for heading orphan prevention)
    output += generatePaginationSetup(config);

    // Add heading spacing (space below headings)
    output += generateHeadingSpacing(config);

    // Add code block styling (backgrounds and borders)
    output += generateCodeBlockStyling(config);

    output += generatePageSetup(config, outputPath, sourceDir);

    // Add heading numbering if enabled
    if (config.numbered_headings) {
      // If treating top level as title, skip numbering level 1 headings
      if (config.treat_top_level_as_title) {
        // Custom numbering function that skips level 1
        // Level 2 becomes "1", level 3 becomes "1.1", etc.
        output += '#set heading(numbering: (..nums) => {\n';
        output += '  if nums.pos().len() == 1 {\n';
        output += '    none\n';
        output += '  } else {\n';
        output += '    numbering("1.1", ..nums.pos().slice(1))\n';
        output += '  }\n';
        output += '})\n\n';

        // Remove hanging indent for level 1 headings (prevents space when numbering is none)
        output += '#show heading.where(level: 1): set heading(hanging-indent: 0pt)\n\n';
      } else {
        // Standard numbering from level 1
        output += '#set heading(numbering: "1.1")\n\n';
      }
    }
  } else {
    // Even without config, apply sensible defaults
    output += '#set block(sticky: true)\n\n';
    output += generateHeadingSpacing({});
    output += generateCodeBlockStyling({ style_code_blocks: true });
  }

  // Process all top-level nodes with keep-together logic
  const nodes = ast.children.filter(node => node.type !== 'yaml');
  const keepCodeWithPrevious = config?.keep_code_with_previous !== false; // Default true

  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i] as Content;

    // Check for keep-together start marker
    if (node.type === 'html' && node.value.trim() === '<!-- keep-together -->') {
      // Find the matching end marker
      let endIndex = i + 1;
      let depth = 1;
      while (endIndex < nodes.length && depth > 0) {
        const checkNode = nodes[endIndex] as Content;
        if (checkNode.type === 'html') {
          if (checkNode.value.trim() === '<!-- keep-together -->') depth++;
          if (checkNode.value.trim() === '<!-- /keep-together -->') depth--;
        }
        if (depth > 0) endIndex++;
      }

      if (depth === 0) {
        // Found matching pair - wrap content in non-breakable block
        output += '#block(breakable: false)[\n';
        for (let j = i + 1; j < endIndex; j++) {
          output += processNode(nodes[j] as Content);
        }
        output += ']\n\n';
        i = endIndex + 1; // Skip past the end marker
        continue;
      }
    }

    // Auto-detect: paragraph followed by code block
    if (keepCodeWithPrevious &&
        node.type === 'paragraph' &&
        i + 1 < nodes.length) {
      const nextNode = nodes[i + 1] as Content;
      if (nextNode.type === 'code') {
        // Wrap both paragraph AND code block in non-breakable block
        output += '#block(breakable: false)[\n';
        output += processNode(node);
        output += processNode(nextNode);
        output += ']\n\n';
        i += 2; // Skip both nodes
        continue;
      }
    }

    // Normal processing
    output += processNode(node);
    i++;
  }

  return output;
}
