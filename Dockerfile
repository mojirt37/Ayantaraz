FROM node:24.15.0-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS build
ARG BUILD_ID
ENV BUILD_ID=$BUILD_ID
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/public ./public
COPY --chown=node:node --from=build /app/.next/standalone ./
COPY --chown=node:node --from=build /app/.next/static ./.next/static
COPY --chown=node:node --from=build /app/src ./src
COPY --chown=node:node --from=build /app/drizzle.config.ts ./
COPY --chown=node:node --from=build /app/db ./db
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then(r => r.json()).then(d => process.exit(d.status === 'ok' || d.status === 'degraded' ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "-e", "require('child_process').execSync('npx drizzle-kit migrate:prod --config=drizzle.config.ts', {stdio:'inherit'}); require('./server.js');"]
