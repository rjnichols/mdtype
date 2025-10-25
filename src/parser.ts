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

  return { ast, mermaidBlocks, config };
}
