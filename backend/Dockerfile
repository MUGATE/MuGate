# Match playwright version in package.json (^1.60.0)
FROM mcr.microsoft.com/playwright:v1.60.0-noble AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts ./scripts
# Browsers ship in the base image; skip re-download during npm ci
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# --- runtime ---
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Writable dirs for local vector store / browser profile fallbacks
RUN mkdir -p /app/data/chroma /app/data/browser-profile

EXPOSE 5000

CMD ["npm", "start"]
