# ---------- Stage 1: dependencies ----------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---------- Stage 3: runtime ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Direktori tempat SQLite diletakkan (persisten via volume), milik user node.
RUN mkdir -p /app/data && chown node:node /app/data

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

USER node
# Prisma migrate diterapkan otomatis sebelum server start.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start"]