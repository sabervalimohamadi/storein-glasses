# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Railway passes all env vars as build args automatically.
# Declare each VITE_* var so Vite can embed it at build time.
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

RUN npm run build

# ── Stage 2: Runtime (nginx) ─────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config template — $PORT is substituted at container startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
