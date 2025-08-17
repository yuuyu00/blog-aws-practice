# Build stage
FROM node:22.11.0-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.10.0

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/server ./packages/server

# Generate Prisma client and GraphQL types
WORKDIR /app/packages/server
RUN pnpm generate

# Build the application - show errors
RUN pnpm build:docker || (echo "Build failed, showing error details:" && cat tsconfig.json && ls -la src/ && exit 1)

# Runtime stage
FROM node:22.11.0-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.10.0

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application and generated files
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=builder /app/packages/server/schema ./packages/server/schema

# Set working directory
WORKDIR /app/packages/server

# Generate Prisma client for production
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run the application
CMD ["node", "dist/express.js"]