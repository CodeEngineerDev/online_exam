FROM node:22-alpine AS build
WORKDIR /app
ARG API_INTERNAL_URL=http://backend:3001/api
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
