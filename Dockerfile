# Multi-stage build for production
FROM node:20-alpine AS frontend-build

# Build frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend production stage
FROM node:20-alpine AS production

# Install production dependencies
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server code
COPY server/ ./

# Copy built frontend to dist directory (matching Vite output)
COPY --from=frontend-build /app/dist ./dist

# Copy server public files (dashboard, etc.)
COPY server/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Create receipts directory with proper permissions
RUN mkdir -p /app/receipts && \
    chown -R nextjs:nodejs /app/receipts && \
    chmod 755 /app/receipts

USER nextjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "index.js"]
