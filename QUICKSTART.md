# Quick Start Guide

## Prerequisites

- Node.js 18+ (for local installation)
- Typst (optional, for PDF generation) - https://github.com/typst/typst/releases
- Docker (for containerized usage)

## Option 1: Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Run the converter:**
   ```bash
   # Generate Typst file
   node dist/cli.js examples/simple.md

   # Or generate PDF directly (requires Typst installed)
   node dist/cli.js examples/simple.md examples/simple.pdf
   ```

   Or make it globally available:
   ```bash
   npm link
   mdtype examples/simple.md examples/output.pdf
   ```

4. **Check the output:**
   - `examples/simple.typ` - Generated Typst file
   - `examples/simple.pdf` - Generated PDF (if requested)
   - `examples/diagrams/` - PNG diagram files

## Option 2: Docker

1. **Build the Docker image:**
   ```bash
   docker build -t mdtype .
   ```

2. **Run the converter:**
   ```bash
   # Generate Typst file
   docker run --rm -v $(pwd)/examples:/workspace mdtype simple.md

   # Or generate PDF directly!
   docker run --rm -v $(pwd)/examples:/workspace mdtype simple.md simple.pdf
   ```

3. **View results:**
   ```bash
   ls examples/
   # You should see simple.typ, simple.pdf, and diagrams/ directory
   ```

**Advantages of Docker**: Includes all dependencies (Node.js, Chromium, Typst) - no local installation needed!

## Testing with Examples

### Simple Example
```bash
# Generate Typst file
mdtype examples/simple.md

# Generate PDF directly
mdtype examples/simple.md examples/simple.pdf
```

### Full-Featured Example
```bash
# Generate Typst file
mdtype examples/sample.md

# Generate PDF directly
mdtype examples/sample.md examples/sample.pdf
```

## Compiling to PDF

### Option 1: Automatic (New!)
Simply specify a `.pdf` extension and mdtype will compile it for you:
```bash
mdtype input.md output.pdf
```

### Option 2: Manual Compilation
To manually compile the generated `.typ` files, you'll need Typst installed:

1. **Install Typst:**
   ```bash
   # macOS
   brew install typst

   # Linux (download from https://github.com/typst/typst/releases)
   # Or use the web app at https://typst.app
   ```

2. **Compile to PDF:**
   ```bash
   typst compile examples/simple.typ
   ```

3. **Or use the web app:**
   - Go to https://typst.app
   - Upload your `.typ` file and SVG diagrams
   - View the rendered PDF

## Common Issues

### Mermaid rendering fails
- Make sure you have Chromium installed (handled automatically in Docker)
- Check internet connection for first-time Chromium download

### SVG files not found in Typst
- Ensure the `diagrams/` folder is in the same directory as the `.typ` file
- Check relative paths in the generated Typst file

### TypeScript compilation errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

## Next Steps

- Read the full [README.md](README.md) for detailed features
- Explore [examples/](examples/) for more complex documents
- Customize the converter in `src/converter.ts` for your needs
