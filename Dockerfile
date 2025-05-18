# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .
RUN yarn build

# Stage 2: Final image
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

RUN yarn global add pm2

EXPOSE 5004

CMD ["pm2-runtime", "dist/index.cjs"]