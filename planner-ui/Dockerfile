FROM node:22-alpine AS build
WORKDIR /app

COPY planner-ui/package*.json ./
RUN npm install

COPY planner-ui/ ./
RUN npm run build


FROM nginx:alpine

COPY planner-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
