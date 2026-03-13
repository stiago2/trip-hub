FROM node:22-slim

WORKDIR /app

COPY . .

RUN npm ci --legacy-peer-deps

RUN npx nx build api --configuration=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node apps/backend/api/dist/main.js"]
