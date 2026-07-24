FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
USER node
EXPOSE 8000
ENV NODE_ENV=production
CMD ["dumb-init", "sh", "-c", "npx drizzle-kit push --force 2>/dev/null || true && npx tsx src/index.ts"]