#!/bin/bash

# Installation script for mdtype

set -e

echo "======================================"
echo "  mdtype Installation"
echo "======================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "Building project..."
npm run build

echo ""
echo "======================================"
echo "✓ Installation complete!"
echo "======================================"
echo ""
echo "Usage:"
echo "  node dist/cli.js <input.md> [output.typ]"
echo ""
echo "Or install globally with:"
echo "  npm link"
echo "Then use:"
echo "  mdtype <input.md> [output.typ]"
echo ""
echo "Try the examples:"
echo "  node dist/cli.js examples/simple.md"
echo ""
