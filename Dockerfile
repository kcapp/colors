FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts=false

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY *.js ./
COPY package.json ./

ENV NODE_ENV=production

CMD ["node", "kcapp-colors.js"]