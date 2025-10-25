# Multi-stage build for mdtype
FROM node:20-alpine AS builder

# Install dependencies needed for Puppeteer/Chromium (required by mermaid-cli)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install Chromium and dependencies for runtime
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Install Typst
# Get latest version from GitHub releases
RUN TYPST_VERSION=$(curl -s https://api.github.com/repos/typst/typst/releases/latest | grep '"tag_name"' | cut -d'"' -f4) && \
    curl -L "https://github.com/typst/typst/releases/download/${TYPST_VERSION}/typst-x86_64-unknown-linux-musl.tar.xz" -o typst.tar.xz && \
    tar -xf typst.tar.xz && \
    mv typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst && \
    rm -rf typst.tar.xz typst-x86_64-unknown-linux-musl && \
    chmod +x /usr/local/bin/typst

# Set Puppeteer to use system Chromium and set Docker environment flag
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    DOCKER_ENV=true

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy puppeteer config for mermaid-cli
COPY puppeteer-config.json /app/

# Set up working directory for file I/O
WORKDIR /workspace

# Entrypoint
ENTRYPOINT ["node", "/app/dist/cli.js"]
