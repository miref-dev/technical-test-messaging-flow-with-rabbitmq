FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

EXPOSE 3002

CMD ["bun", "run", "src/index.ts"]
