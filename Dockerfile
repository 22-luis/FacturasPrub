
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Set environment variables for Prisma
# These might be needed if your schema relies on them during generation,
# but actual connection string for runtime will be set in Cloud Run.
# ENV DATABASE_URL="placeholder_for_build_if_needed"

# Install dependencies
# Copy package.json and lock file
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Determine package manager and install dependencies
RUN \
  if [ -f package-lock.json ]; then \
    echo "Using npm" && npm ci; \
  elif [ -f pnpm-lock.yaml ]; then \
    echo "Using pnpm" && npm install -g pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    echo "Using yarn" && yarn install --frozen-lockfile; \
  else \
    echo "No lockfile found, using npm install. Warning: This might lead to non-reproducible builds." && npm install; \
  fi

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# Ensure build-time environment variables are available if your app uses them during build
# Example: ENV NEXT_PUBLIC_API_URL_BUILDTIME=${NEXT_PUBLIC_API_URL_BUILDTIME}
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Set HOSTNAME to 0.0.0.0 to accept connections from any IP address.
# This is important for Cloud Run.
ENV HOSTNAME "0.0.0.0"
# PORT will be automatically set by Cloud Run (default 8080)

# Copy necessary package files for installing production dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install only production dependencies
RUN \
  if [ -f package-lock.json ]; then \
    npm ci --omit=dev; \
  elif [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && pnpm install --prod --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --production --frozen-lockfile; \
  else \
    echo "No lockfile found, attempting npm install --omit=dev. Warning: This might lead to non-reproducible builds." && npm install --omit=dev; \
  fi

# Copy the standalone Next.js output from the builder stage
COPY --from=builder /app/.next/standalone ./
# Copy the public folder from the builder stage
COPY --from=builder /app/public ./public
# Copy the static assets from .next/static (needed by standalone output)
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on (Next.js default is 3000, Cloud Run will set PORT env var)
EXPOSE 3000

# Start the Next.js application using the server.js from the standalone output
CMD ["node", "server.js"]
