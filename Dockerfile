FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN npm ci --legacy-peer-deps

RUN npx prisma generate --schema=prisma/schema.prisma

RUN npx nx build api --configuration=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node apps/backend/api/dist/main.js"]
