FROM node:25-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
COPY src/config/config.cjs ./dist/config/config.cjs
COPY src/migrations ./dist/migrations

FROM node:25-alpine

WORKDIR /app

COPY package*.json ./
COPY .sequelizerc.cjs ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./src
RUN mkdir tmp

EXPOSE 3000
CMD ["node", "src/index.js"]