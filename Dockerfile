FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.mjs ./next.config.mjs
COPY --from=base /app/next-env.d.ts ./next-env.d.ts
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/src ./src
COPY --from=base /app/middleware.ts ./middleware.ts

RUN mkdir -p /app/storage /app/storage/uploads /app/storage/products /app/storage/portfolio

EXPOSE 3000
CMD ["npm", "run", "start"]
