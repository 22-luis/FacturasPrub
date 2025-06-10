# Dockerfile

# 1. Builder Stage: Install dependencies and build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
# Choose one of the following based on your package manager:
# If you use npm:
RUN npm ci
# If you use pnpm:
# RUN apk add --no-cache libc6-compat
# RUN corepack enable
# RUN pnpm install --frozen-lockfile
# If you use yarn:
# RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma Client and build the Next.js app
RUN npx prisma generate
RUN npm run build

# 2. Runner Stage: Create a minimal image with only production dependencies and the built app
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Next.js standalone output already includes node_modules, so we don't need to copy package.json and run npm install again if using that.
# However, it's good practice to copy only necessary files.
# Standalone mode copies server.js, .next/static, .next/server, and public folders.

# Copy standalone output
# This includes the .next/static, .next/server, public, and server.js etc.
COPY --from=builder /app/.next/standalone ./

# The 'public' folder is included in the .next/standalone output,
# so it's copied with the line above. No need for a separate copy from the builder's source /app/public.

# Expose the port the app runs on
# Cloud Run injects the PORT env var, Next.js standalone server.js respects it.
# Default is 3000 if PORT is not set.
EXPOSE 3000

# Set the PUID and PGID for the node user for better security (optional)
# ENV PUID=1001 PGID=1001
# RUN addgroup -g ${PGID} node && \
#     adduser -u ${PUID} -G node -s /bin/sh -D node

# USER node

# Start the Next.js app
# The standalone output creates a server.js file
CMD ["node", "server.js"]
