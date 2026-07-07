FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && npx prisma generate

COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
RUN cd apps/api && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN apk add --no-cache openssl3

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
