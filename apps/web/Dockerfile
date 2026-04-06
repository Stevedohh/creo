FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV VITE_HOST=0.0.0.0

EXPOSE 4300
CMD ["npx", "nx", "serve", "web"]
