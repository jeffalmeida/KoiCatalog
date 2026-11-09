# ---------- Etapa 1: build do frontend ----------
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Etapa 2: imagem final (só produção) ----------
FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Código do servidor
COPY server ./server

# Frontend compilado da etapa de build
COPY --from=build /app/dist ./dist

# Dados e imagens (podem ser montados como volume para persistir)
COPY data ./data
COPY public ./public

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && apk add --no-cache su-exec

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server/index.mjs"]
