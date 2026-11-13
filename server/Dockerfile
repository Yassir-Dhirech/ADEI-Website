# ---- Stage 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Stage 2: Development (used by docker-compose for nodemon hot reload) ----
FROM base AS dev
COPY package*.json ./
RUN npm ci
RUN mkdir -p /app/uploads && chown -R node:node /app
COPY --chown=node:node . .
USER node
EXPOSE 5001
CMD ["npm", "run", "dev"]

# ---- Stage 3: Production dependencies only ----
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Stage 4: Final Production Image (production deps only, non-root) ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
EXPOSE 5001
CMD ["node", "index.js"]