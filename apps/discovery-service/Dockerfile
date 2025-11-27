FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY nest-cli.json tsconfig*.json ./
COPY apps ./apps
COPY libs ./libs

RUN npm ci

RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/apps/discovery-service/apps/discovery-service/src/main.js"]

