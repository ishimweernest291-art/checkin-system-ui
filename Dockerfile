# Build Stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . ./

# Declare build-time args for all client-visible envs
ARG NEXT_PUBLIC_API_URL
ARG BACKEND_API_URL
ARG JWT_SECRET

# Expose them as ENV so `next build` can inline them
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    BACKEND_API_URL=$BACKEND_API_URL \
    JWT_SECRET=$JWT_SECRET

RUN npm run build

# Serve Stage
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
