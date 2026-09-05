# ==============================================================================
# GigaHub Mobile - Multi-Stage Dockerfile (React SPA + Nginx Alpine)
# ==============================================================================

# Stage 1: Build da SPA React
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Servidor Nginx Alpine de alta performance (~25MB)
FROM nginx:alpine AS runner

# Substitui a configuração padrão do Nginx pelo nginx.conf SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
