FROM node:20-alpine
RUN apk add --no-cache ffmpeg python3 \
    && python3 -m ensurepip \
    && pip3 install --no-cache-dir yt-dlp
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN cd libs/prisma && npx prisma generate --schema=schema/schema.prisma

EXPOSE 3000
CMD ["npx", "nx", "serve", "api"]
