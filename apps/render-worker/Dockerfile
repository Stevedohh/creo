# Render worker: Chromium (for Remotion headless) + ffmpeg (via
# @remotion/renderer's bundled binary) + Node 20. Debian base so
# Chromium + fonts install cleanly.
FROM node:20-bookworm-slim

# Chromium + common fonts used by text clips. Remotion's renderer can
# download its own Chromium via --browser-executable but using the
# system one keeps the image smaller and predictable.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto \
    fonts-noto-color-emoji \
    ffmpeg \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_OPTIONS=--max-old-space-size=4096

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN cd libs/prisma && npx prisma generate --schema=schema/schema.prisma

ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "nx", "serve", "render-worker"]
