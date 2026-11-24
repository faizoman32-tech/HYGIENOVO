FROM node:24-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx vite build
ENV NODE_ENV=production
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.ts"]
