# Stage 1: Build and dependencies
FROM node:22-bookworm-slim AS base

WORKDIR /app

# Install dependencies needed for node-gyp if prebuilt sqlite3 binary is unavailable
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package descriptors
COPY package*.json ./

# Install dependencies and build native sqlite3 from source for container environment
RUN npm ci --omit=dev && npm rebuild sqlite3 --build-from-source

# Stage 2: Production runtime image
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Create application user for security
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nodejs

# Copy dependencies from base
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nodejs:nodejs /app/package*.json ./

# Copy application source code
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs actions/ ./actions/
COPY --chown=nodejs:nodejs ai/ ./ai/
COPY --chown=nodejs:nodejs api/ ./api/
COPY --chown=nodejs:nodejs database/ ./database/
COPY --chown=nodejs:nodejs engine/ ./engine/
COPY --chown=nodejs:nodejs events/ ./events/
COPY --chown=nodejs:nodejs gateway/ ./gateway/

# Ensure data directory exists with write permissions for SQLite
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

USER nodejs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/v1/status', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "server.js"]
