FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 8000
ENV NODE_ENV=production
CMD ["dumb-init", "node", "dist/index.js"]