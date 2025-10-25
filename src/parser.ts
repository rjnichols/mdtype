import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
import { parse as parseYaml } from 'yaml';
import type { Root, Code, YAML } from 'mdast';

export interface ParsedMarkdown {
  ast: Root;
  mermaidBlocks: MermaidBlock[];
  config: DocumentConfig;
}

export interface MermaidBlock {
  id: string;
  content: string;
  position: number;
}

export interface DocumentConfig {
  title?: string;
  author?: string;
  date?: string;
  numbered_headings?: boolean;
  toc_depth?: number;
  font?: string;  // Font family: "serif", "sans-serif", or custom font name
  prevent_heading_orphans?: boolean;  // Prevent headings from appearing alone at bottom of page (default: true)
  style_code_blocks?: boolean;  // Add background and styling to code blocks (default: true)
  treat_top_level_as_title?: boolean;  // Treat single top-level heading as document title (auto-detected by default)
  page_break_before_heading?: number | false;  // Add page breaks before headings at specified level (default: 2)
  heading_spacing?: string | false | { before?: string | false, after?: string | false };  // Spacing around headings (default: before "2.5em", after "1.5em"), set to false to disable
  keep_code_with_previous?: boolean;  // Keep code blocks together with immediately preceding paragraph (default: true)
  header?: {
    left?: string;
    center?: string;
    right?: string;
  };
  footer?: {
    left?: string;
    center?: string;
    right?: string;
  };
}

/**
 * Parse markdown content into an AST with support for GFM, math, and frontmatter
 */
export function parseMarkdown(content: string): ParsedMarkdown {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkMath);

  const ast = processor.parse(content) as Root;
  const mermaidBlocks: MermaidBlock[] = [];
  let mermaidCount = 0;
  let config: DocumentConfig = {};

  // Extract frontmatter (YAML)
  visit(ast, 'yaml', (node: YAML) => {
    try {
      const parsed = parseYaml(node.value);
      if (parsed && typeof parsed === 'object') {
        config = parsed as DocumentConfig;
      }
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter:', error instanceof Error ? error.message : error);
    }
  });

  // Extract mermaid code blocks
  visit(ast, 'code', (node: Code, index) => {
    if (node.lang === 'mermaid') {
      mermaidBlocks.push({
        id: `mermaid-${mermaidCount++}`,
        content: node.value,
        position: index ?? 0
      });
    }
  });

  // Auto-detect if top level should be treated as title
  // Only auto-detect if user hasn't explicitly set this in frontmatter
  if (config.treat_top_level_as_title === undefined) {
    let level1Headings: any[] = [];
    let firstHeading: any = null;

    visit(ast, 'heading', (node: any) => {
      if (!firstHeading) {
        firstHeading = node;
      }
      if (node.depth === 1) {
        level1Headings.push(node);
      }
    });

    // Treat as title if:
    // 1. There's exactly one level 1 heading
    // 2. It's the first heading in the document
    config.treat_top_level_as_title =
      level1Headings.length === 1 &&
      firstHeading &&
      firstHeading.depth === 1;
  }

  return { ast, mermaidBlocks, config };
}
