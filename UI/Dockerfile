# Stage 1: Build the React/Vite application
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build arguments for dynamic backend URL injection
ARG VITE_BACKEND_URL=""
ARG VITE_BACKEND_WS_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_BACKEND_WS_URL=$VITE_BACKEND_WS_URL

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine-slim

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
