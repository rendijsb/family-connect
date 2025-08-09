# frontend/Dockerfile
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Environment variables for runtime configuration
ENV API_URL=http://localhost:8000/api
ENV APP_ENV=production

EXPOSE 80

CMD ["/start.sh"]
