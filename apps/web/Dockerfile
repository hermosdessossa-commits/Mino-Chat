# =============================================================================
# Mino-Chat Web - Multi-stage Dockerfile
# =============================================================================

# ---- Builder Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/src ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/
COPY apps/web/src ./apps/web/src
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/tsconfig.node.json ./apps/web/
COPY apps/web/vite.config.ts ./apps/web/
COPY apps/web/tailwind.config.js ./apps/web/
COPY apps/web/postcss.config.js ./apps/web/
COPY apps/web/index.html ./apps/web/

RUN pnpm --filter=@mino-chat/db db:generate
RUN pnpm --filter=@mino-chat/shared build
RUN pnpm --filter=@mino-chat/db build
RUN pnpm --filter=@mino-chat/web build

# ---- Runner Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable pnpm

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => { if (r.statusCode !== 200) process.exit(1) })"

CMD ["npx", "serve", "-s", "apps/web/dist", "-l", "5173"]