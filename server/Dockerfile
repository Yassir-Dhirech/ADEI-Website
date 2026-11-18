# ---- Stage 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Stage 2: Development (tsx watch hot reload) ----
FROM base AS dev
COPY package*.json ./
RUN npm ci
RUN mkdir -p /app/uploads && chown -R node:node /app
COPY --chown=node:node . .
USER node
EXPOSE 5001
CMD ["npm", "run", "dev"]

# ---- Stage 3: Build TypeScript ----
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 4: Production dependencies only ----
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Stage 5: Final Production Image (compiled JS + prod deps, non-root) ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node config/sequelize.config.js ./config/sequelize.config.js
COPY --chown=node:node .sequelizerc ./.sequelizerc
COPY --chown=node:node package.json ./package.json
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
EXPOSE 5001
CMD ["node", "dist/index.js"]
