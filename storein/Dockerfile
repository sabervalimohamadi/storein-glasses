# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Prune dev dependencies so the runtime stage is lean
RUN npm prune --production

# ── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# wget for health check probes
RUN apk add --no-cache wget

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Uploads dir — mount a Railway Volume here to persist files across deploys
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

COPY --from=builder --chown=nestjs:nodejs /app/dist         ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

USER nestjs

# Railway injects $PORT at runtime; default to 3000 for local Docker usage
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main"]
