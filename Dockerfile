# Etapa 1: Build
FROM node:22.16.0 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:22.16.0

WORKDIR /app

# Solo copiamos lo necesario para standalone
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/prisma ./prisma  
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
