# VoiceNote Pro — Single-container build
# For multi-container: use docker-compose.yml instead

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --frozen-lockfile
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend runtime
FROM node:20-alpine AS runtime
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

# Backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --frozen-lockfile --omit=dev

# Backend source
COPY backend/ ./backend/

# Frontend static files served by backend
COPY --from=frontend-builder /app/frontend/dist ./backend/public

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3002/health 2>/dev/null || exit 1

USER nodeuser
EXPOSE 3002
WORKDIR /app/backend
CMD ["node", "index.js"]
