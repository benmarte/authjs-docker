FROM node:20-alpine AS base
 
FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
RUN npm install -g pnpm

# Set working directory
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @spotlite/nextjs --docker
 
# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
RUN npm install -g pnpm

WORKDIR /app
 
# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install
 
# Build the project
COPY --from=builder /app/out/full/ .
RUN CI=true SKIP_ENV_VALIDATION=true pnpm turbo run build --filter=@spotlite/nextjs...
 
FROM base AS runner
WORKDIR /app
 
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
 
COPY --from=installer /app/apps/nextjs/next.config.js .
COPY --from=installer /app/apps/nextjs/package.json .
 
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/.next/static ./apps/nextjs/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/nextjs/public ./apps/nextjs/public
 
EXPOSE 3000
ENV PORT 3000
# ENV HOSTNAME "0.0.0.0"

CMD node apps/nextjs/server.js