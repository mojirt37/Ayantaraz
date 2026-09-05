# ─────────────────────────────────────────────────────────────────────
# Dockerfile — Ayantaraz production multi-stage build
#
# Stages: base → dependencies → build → runtime
# Output: .next/standalone (minimal production image)
#
# Migrations are run by a separate init container (docker-compose).
# This image serves the application only.
# ─────────────────────────────────────────────────────────────────────

# ── Stage 1: base ────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# ── Stage 2: dependencies ────────────────────────────────────────────
FROM base AS dependencies
COPY package.json package-lock.json ./
# Install only production deps for the runtime stage
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ── Stage 3: build ───────────────────────────────────────────────────
FROM base AS build
ARG BUILD_ID
ENV BUILD_ID=$BUILD_ID
# Install all deps (including dev) for build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
# Standalone output includes only what the server needs
RUN npm run build

# ── Stage 4: production runtime ──────────────────────────────────────
FROM base AS runtime

# Copy production node_modules
COPY --from=dependencies /app/node_modules ./node_modules

# Copy standalone server
COPY --from=build /app/.next/standalone ./

# Copy static assets
COPY --from=build /app/.next/static ./.next/static

# Copy public assets
COPY --from=build /app/public ./public

# Copy migration files and drizzle config (needed by init container)
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/db ./db

# Copy source for drizzle-kit (reads schema.ts)
COPY --from=build /app/src ./src

# Remove dev-only files not needed in runtime
RUN rm -rf src/app src/components src/modules src/shared src/infrastructure \
    tests docs scripts verification playwright.config.ts vitest.config.ts \
    tsconfig.json eslint.config.mjs .prettierrc.json .prettierignore \
    AGENTS.md ANALYSIS-*.md AUDIT-*.md SCENARIOS-*.md \
    ayan-taraz-production-grade-agent-instructions-*.md \
    opencode.json next-env.d.ts 2>/dev/null || true

# Non-root user
USER node

EXPOSE 3000

# Health check — uses the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e " \
    fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health') \
      .then(r => r.json()) \
      .then(d => process.exit(d.status === 'ok' || d.status === 'degraded' ? 0 : 1)) \
      .catch(() => process.exit(1)) \
  "

# Start the Next.js server (migrations handled by init container)
CMD ["node", "server.js"]
