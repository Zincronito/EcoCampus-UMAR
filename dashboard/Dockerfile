FROM node:25-alpine AS builder

# Instalar OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Regenerar Prisma para Linux dentro del contenedor
RUN npx prisma generate

RUN npm run build

FROM node:25-alpine

# Instalar OpenSSL en la imagen final también
RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]