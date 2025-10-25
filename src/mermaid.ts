import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname, resolve } from 'path';
import { existsSync } from 'fs';
import type { MermaidBlock } from './parser';

const execAsync = promisify(exec);

// Find puppeteer config (works both in development and Docker)
function getPuppeteerConfigPath(): string {
  const paths = [
    resolve(process.cwd(), 'puppeteer-config.json'),  // Local development
    resolve(__dirname, '../puppeteer-config.json'),    // Built app (dist/)
    '/app/puppeteer-config.json'                       // Docker
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Fallback to relative path
  return 'puppeteer-config.json';
}

export interface RenderedDiagram {
  id: string;
  imagePath: string;
}

/**
 * Render mermaid diagrams to PNG files (better Typst compatibility than SVG)
 */
export async function renderMermaidDiagrams(
  blocks: MermaidBlock[],
  outputDir: string
): Promise<RenderedDiagram[]> {
  if (blocks.length === 0) {
    return [];
  }

  // Create output directory for diagrams
  const diagramDir = join(dirname(outputDir), 'diagrams');
  await mkdir(diagramDir, { recursive: true });

  const rendered: RenderedDiagram[] = [];

  for (const block of blocks) {
    const mmdPath = join(diagramDir, `${block.id}.mmd`);
    const pngPath = join(diagramDir, `${block.id}.png`);

    // Write mermaid content to temporary file
    await writeFile(mmdPath, block.content, 'utf-8');

    try {
      // Use mermaid-cli to render PNG (better Typst support than SVG)
      // PNG avoids the "foreign object" issue that SVG has with text rendering in Typst
      // Scale up for better quality: -s 2 means 2x resolution
      const puppeteerConfig = getPuppeteerConfigPath();

      // Try to find mmdc - check if we're in Docker or local environment
      const mmdcCommand = process.env.DOCKER_ENV === 'true'
        ? 'node /app/node_modules/@mermaid-js/mermaid-cli/src/cli.js'
        : 'npx -y mmdc';

      await execAsync(`${mmdcCommand} -i "${mmdPath}" -o "${pngPath}" -b white -s 2 -p "${puppeteerConfig}"`, {
        env: { ...process.env, PUPPETEER_ARGS: '--no-sandbox --disable-setuid-sandbox' }
      });

      rendered.push({
        id: block.id,
        imagePath: pngPath
      });

      console.log(`✓ Rendered ${block.id}.png`);
    } catch (error) {
      console.error(`✗ Failed to render ${block.id}:`, error instanceof Error ? error.message : error);
      // Continue with other diagrams even if one fails
    }
  }

  return rendered;
}
