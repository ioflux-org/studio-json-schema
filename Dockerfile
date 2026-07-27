FROM node:lts-alpine AS build

WORKDIR /app
RUN apk add --no-cache git
COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build

RUN cd docs && npm install && npm run build
RUN mkdir -p dist/docs && cp -r docs/.vitepress/dist/* dist/docs/

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
