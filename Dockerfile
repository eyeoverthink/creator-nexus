# Stage 1: Build the Vite frontend
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN rm -f .npmrc
ARG VITE_BASE44_APP_BASE_URL=https://creator-nexus.base44.app
ENV VITE_BASE44_APP_BASE_URL=$VITE_BASE44_APP_BASE_URL
RUN npx vite build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
