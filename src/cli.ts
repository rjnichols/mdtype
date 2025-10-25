#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { resolve, extname, basename, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { parseMarkdown } from './parser';
import { renderMermaidDiagrams, RenderedDiagram } from './mermaid';
import { convertToTypst } from './converter';

const execAsync = promisify(exec);

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
mdtype - Convert Markdown with Mermaid diagrams to Typst

Usage:
  mdtype <input.md> [output.typ|output.pdf]

Arguments:
  input.md       Input markdown file
  output.typ     Output Typst file (optional, defaults to input name with .typ extension)
  output.pdf     Output PDF file (automatically compiles with Typst)

Examples:
  mdtype document.md              # Creates document.typ
  mdtype document.md output.typ   # Creates output.typ
  mdtype document.md output.pdf   # Creates output.typ and compiles to output.pdf
  mdtype README.md report.pdf     # Creates report.typ and report.pdf

Options:
  --help, -h  Show this help message
`);
    process.exit(0);
  }

  const inputPath = resolve(args[0]);
  let requestedOutput: string;
  let typstPath: string;
  let shouldGeneratePdf = false;
  let pdfPath: string | null = null;

  if (args.length >= 2) {
    requestedOutput = resolve(args[1]);
    const ext = extname(requestedOutput);

    if (ext === '.pdf') {
      // User wants PDF output, create .typ file with same base name
      shouldGeneratePdf = true;
      pdfPath = requestedOutput;
      const baseWithoutExt = requestedOutput.slice(0, -4);
      typstPath = `${baseWithoutExt}.typ`;
    } else {
      // User wants .typ or other extension
      typstPath = requestedOutput;
    }
  } else {
    // Auto-generate output filename
    const inputBase = basename(inputPath, extname(inputPath));
    typstPath = resolve(dirname(inputPath), `${inputBase}.typ`);
  }

  try {
    console.log(`Converting: ${inputPath}`);
    if (shouldGeneratePdf) {
      console.log(`Output to: ${pdfPath} (via ${basename(typstPath)})\n`);
    } else {
      console.log(`Output to: ${typstPath}\n`);
    }

    // Read input file
    const markdown = await readFile(inputPath, 'utf-8');

    // Parse markdown
    console.log('Parsing markdown...');
    const { ast, mermaidBlocks, config } = parseMarkdown(markdown);
    console.log(`Found ${mermaidBlocks.length} mermaid diagram(s)\n`);
    if (config.header || config.footer) {
      console.log('Found header/footer configuration in frontmatter\n');
    }

    // Render mermaid diagrams to PNG
    let diagrams: RenderedDiagram[] = [];
    if (mermaidBlocks.length > 0) {
      console.log('Rendering mermaid diagrams...');
      diagrams = await renderMermaidDiagrams(mermaidBlocks, typstPath);
      console.log();
    }

    // Convert to Typst
    console.log('Converting to Typst...');
    const typstContent = convertToTypst(ast, {
      outputPath: dirname(typstPath),
      diagrams,
      config,
      sourceDir: dirname(inputPath)
    });

    // Write Typst file
    await writeFile(typstPath, typstContent, 'utf-8');
    console.log(`✓ Typst file created: ${typstPath}`);

    // Compile to PDF if requested
    if (shouldGeneratePdf && pdfPath) {
      console.log('\nCompiling to PDF...');
      try {
        await execAsync(`typst compile "${typstPath}" "${pdfPath}"`);
        console.log(`✓ PDF generated: ${pdfPath}`);
      } catch (error) {
        console.error('✗ PDF compilation failed:', error instanceof Error ? error.message : error);
        console.error('  Make sure Typst is installed: https://github.com/typst/typst/releases');
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
