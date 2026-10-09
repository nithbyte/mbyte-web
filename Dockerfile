# ==============================================================================
# MBYTE ADMIN WEB MULTI-STAGE DOCKERFILE
# Next.js 16 Standalone Output + Node.js 20 LTS Alpine + Non-Root User
# ==============================================================================

# --- Stage 1: Base Alpine Image ---
FROM node:20-alpine AS base
RUN apk update && apk add --no-cache libc6-compat curl dumb-init
WORKDIR /app

# --- Stage 2: Dependencies ---
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# --- Stage 3: Builder ---
FROM dependencies AS builder
COPY next.config.ts tsconfig*.json eslint.config.mjs ./
COPY public ./public
COPY src ./src
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# --- Stage 4: Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
