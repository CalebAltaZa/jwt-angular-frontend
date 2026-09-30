# ---------- Etapa 1: build de Angular --------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Se copian primero los manifiestos para cachear la instalación de dependencias.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Etapa 2: nginx sirve el build y hace de reverse proxy -----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/jwt-angular-frontend/browser /usr/share/nginx/html

EXPOSE 80
