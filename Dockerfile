FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci && npm ci --prefix backend

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data
EXPOSE 8080

CMD ["node", "backend/server.js"]
