FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY nest-cli.json tsconfig*.json ./

RUN npm ci

COPY . .

CMD ["npm", "run", "start:cms:dev"]