#!/bin/bash
# migration-helper.sh - Helper script for repository split and management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_USERNAME="rendijsb"
MAIN_REPO="family-connect"
BACKEND_REPO="family-connect-backend"
FRONTEND_REPO="family-connect-frontend"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create backend repository
create_backend_repo() {
    print_status "Creating backend repository..."

    if [ -d "$BACKEND_REPO" ]; then
        print_warning "Backend directory already exists. Skipping..."
        return
    fi

    mkdir "$BACKEND_REPO"
    cd "$BACKEND_REPO"

    # Initialize git
    git init

    # Copy backend files (adjust source path as needed)
    if [ -d "../family-connect/backend" ]; then
        cp -r ../family-connect/backend/* .
    else
        print_error "Backend source directory not found. Please adjust the path."
        return 1
    fi

    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << 'EOF'
FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip \
    mysql-client

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . /var/www

# Set permissions
RUN chown -R www-data:www-data /var/www

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Expose port
EXPOSE 8000

# Start PHP server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
EOF
    fi

    # Create .dockerignore
    cat > .dockerignore << 'EOF'
node_modules
.git
.env
.env.example
storage/logs/*
bootstrap/cache/*
vendor
EOF

    # Create README.md
    cat > README.md << 'EOF'
# Family Connect - Backend API

Laravel-based REST API for the Family Connect application.

## Requirements

- PHP 8.1+
- Composer
- MySQL/PostgreSQL
- Redis (optional)

## Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Docker Development

```bash
docker build -t family-connect-backend .
docker run -p 8000:8000 family-connect-backend
```

## API Documentation

The API documentation is available at `/api/documentation` when running in development mode.

## Testing

```bash
php artisan test
```
EOF

    git add .
    git commit -m "Initial backend repository setup"

    print_success "Backend repository created successfully!"
    cd ..
}

# Function to create frontend repository
create_frontend_repo() {
    print_status "Creating frontend repository..."

    if [ -d "$FRONTEND_REPO" ]; then
        print_warning "Frontend directory already exists. Skipping..."
        return
    fi

    mkdir "$FRONTEND_REPO"
    cd "$FRONTEND_REPO"

    # Initialize git
    git init

    # Copy frontend files (adjust source path as needed)
    if [ -d "../family-connect/frontend" ]; then
        cp -r ../family-connect/frontend/* .
    else
        print_error "Frontend source directory not found. Please adjust the path."
        return 1
    fi

    # Create production Dockerfile
    cat > Dockerfile << 'EOF'
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build --prod

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Create development Dockerfile
    cat > Dockerfile.dev << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Start development server
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "1"]
EOF

    # Create nginx config
    cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Handle Angular routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

    # Create .dockerignore
    cat > .dockerignore << 'EOF'
node_modules
.git
.angular
dist
e2e
.vscode
*.log
EOF

    # Create README.md
    cat > README.md << 'EOF'
# Family Connect - Frontend

Angular + Ionic mobile application for Family Connect.

## Requirements

- Node.js 18+
- npm or yarn
- Ionic CLI
- Capacitor CLI (for mobile builds)

## Installation

```bash
npm install
ionic serve
```

## Mobile Development

### iOS
```bash
ionic capacitor add ios
ionic capacitor run ios
```

### Android
```bash
ionic capacitor add android
ionic capacitor run android
```

## Build for Production

```bash
npm run build
```

## Docker Development

```bash
# Development
docker build -f Dockerfile.dev -t family-connect-frontend-dev .
docker run -p 4200:4200 family-connect-frontend-dev

# Production
docker build -t family-connect-frontend .
docker run -p 80:80 family-connect-frontend
```

## Testing

```bash
npm test
npm run e2e
```
EOF

    git add .
    git commit -m "Initial frontend repository setup"

    print_success "Frontend repository created successfully!"
    cd ..
}

# Function to create main repository with submodules
create_main_repo() {
    print_status "Creating main repository with submodules..."

    if [ -d "$MAIN_REPO" ]; then
        print_warning "Main repository directory already exists. Skipping..."
        return
    fi

    mkdir "$MAIN_REPO"
    cd "$MAIN_REPO"

    git init

    # Add submodules (you'll need to push the other repos first)
    print_status "Adding submodules..."
    git submodule add "https://github.com/$GITHUB_USERNAME/$BACKEND_REPO.git" backend
    git submodule add "https://github.com/$GITHUB_USERNAME/$FRONTEND_REPO.git" frontend

    # Create docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/var/www
      - /var/www/vendor
    depends_on:
      - database
      - redis
    environment:
      - APP_ENV=local
      - APP_DEBUG=true
      - DB_HOST=database
      - DB_DATABASE=family_connect
      - DB_USERNAME=family_connect
      - DB_PASSWORD=password
      - REDIS_HOST=redis
    networks:
      - family-connect-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
    networks:
      - family-connect-network

  database:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_DATABASE: family_connect
      MYSQL_ROOT_PASSWORD: password
      MYSQL_USER: family_connect
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - family-connect-network

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    networks:
      - family-connect-network

volumes:
  mysql_data:

networks:
  family-connect-network:
    driver: bridge
EOF

    # Create production docker-compose
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - DB_HOST=database
      - DB_DATABASE=family_connect
      - DB_USERNAME=family_connect
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
    depends_on:
      - database
      - redis
    networks:
      - family-connect-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - family-connect-network

  database:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: family_connect
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_USER: family_connect
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - family-connect-network

  redis:
    image: redis:alpine
    networks:
      - family-connect-network

volumes:
  mysql_data:

networks:
  family-connect-network:
    driver: bridge
EOF

    # Create .env.example
    cat > .env.example << 'EOF'
# Database
DB_PASSWORD=your_secure_password_here

# Backend Environment
APP_KEY=base64:your_laravel_app_key
APP_ENV=production
APP_DEBUG=false

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=your-bucket-name
EOF

    # Create management scripts
    mkdir -p scripts

    # Create update script
    cat > scripts/update-submodules.sh << 'EOF'
#!/bin/bash
echo "Updating all submodules to latest..."
git submodule update --recursive --remote
echo "Submodules updated successfully!"
EOF

    # Create deploy script
    cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Deploying Family Connect..."

# Pull latest changes
git pull origin main
git submodule update --recursive --remote

# Build and restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

echo "Deployment completed successfully!"
EOF

    # Create development script
    cat > scripts/dev-setup.sh << 'EOF'
#!/bin/bash
set -e

echo "Setting up development environment..."

# Initialize submodules
git submodule update --init --recursive

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please update .env file with your configuration"
fi

# Start development environment
docker-compose up -d

echo "Development environment is ready!"
echo "Frontend: http://localhost:4200"
echo "Backend: http://localhost:8000"
EOF

    chmod +x scripts/*.sh

    # Create main README
    cat > README.md << 'EOF'
# Family Connect

A comprehensive family communication and management platform built with Laravel and Angular/Ionic.

## Architecture

- **Backend**: Laravel REST API (`/backend` - submodule)
- **Frontend**: Angular + Ionic mobile app (`/frontend` - submodule)
- **Database**: MySQL
- **Cache**: Redis
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Development Setup

```bash
# Clone with submodules
git clone --recursive https://github.com/yourusername/family-connect.git
cd family-connect

# Setup development environment
./scripts/dev-setup.sh
```

### Manual Setup

```bash
# Clone repository
git clone https://github.com/yourusername/family-connect.git
cd family-connect

# Initialize submodules
git submodule update --init --recursive

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d
```

### Access Points

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000
- **Database**: localhost:3306

## Development Workflow

### Daily Development

```bash
# Pull latest changes
git pull
./scripts/update-submodules.sh

# Work in submodules
cd backend
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

cd ../frontend
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# Update main repository
cd ..
git add .
git commit -m "Update submodules"
git push origin main
```

### Working with Submodules

```bash
# Update all submodules to latest
./scripts/update-submodules.sh

# Update specific submodule
cd backend
git pull origin main
cd ..
git add backend
git commit -m "Update backend submodule"

# Check submodule status
git submodule status
```

## Production Deployment

```bash
# Deploy to production
./scripts/deploy.sh
```

## Project Structure

```
family-connect/
├── backend/              # Laravel API (submodule)
├── frontend/             # Angular/Ionic app (submodule)
├── scripts/              # Management scripts
├── docker-compose.yml    # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md
```

## Contributing

1. Fork the main repository and relevant submodules
2. Create feature branches in the appropriate submodule
3. Make your changes and test thoroughly
4. Submit pull requests to the submodule repositories
5. Update the main repository to reference new commits

## Submodule Repositories

- Backend: https://github.com/yourusername/family-connect-backend
- Frontend: https://github.com/yourusername/family-connect-frontend

## License

MIT License - see LICENSE file for details.
EOF

    # Create .gitignore
    cat > .gitignore << 'EOF'
.env
.env.local
.env.production
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
EOF

    git add .
    git commit -m "Initial main repository with submodules setup"

    print_success "Main repository created successfully!"
    cd ..
}

# Function to push all repositories
push_repositories() {
    print_status "Pushing repositories to GitHub..."

    # You'll need to create these repositories on GitHub first
    print_warning "Make sure you've created the following repositories on GitHub:"
    echo "  - $GITHUB_USERNAME/$BACKEND_REPO"
    echo "  - $GITHUB_USERNAME/$FRONTEND_REPO"
    echo "  - $GITHUB_USERNAME/$MAIN_REPO"

    read -p "Press Enter when repositories are created..."

    # Push backend
    if [ -d "$BACKEND_REPO" ]; then
        cd "$BACKEND_REPO"
        git remote add origin "https://github.com/$GITHUB_USERNAME/$BACKEND_REPO.git"
        git push -u origin main
        cd ..
        print_success "Backend repository pushed!"
    fi

    # Push frontend
    if [ -d "$FRONTEND_REPO" ]; then
        cd "$FRONTEND_REPO"
        git remote add origin "https://github.com/$GITHUB_USERNAME/$FRONTEND_REPO.git"
        git push -u origin main
        cd ..
        print_success "Frontend repository pushed!"
    fi

    # Push main repository
    if [ -d "$MAIN_REPO" ]; then
        cd "$MAIN_REPO"
        git remote add origin "https://github.com/$GITHUB_USERNAME/$MAIN_REPO.git"
        git push -u origin main
        cd ..
        print_success "Main repository pushed!"
    fi
}

# Main execution
main() {
    echo "=== Family Connect Repository Split Tool ==="
    echo ""

    print_status "This script will help you split your monorepo into submodules."
    print_warning "Make sure you have your current project in '../current-project/'"

    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi

    # Create repositories
    create_backend_repo
    create_frontend_repo
    create_main_repo

    print_success "Repository split completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Create the repositories on GitHub:"
    echo "   - $GITHUB_USERNAME/$BACKEND_REPO"
    echo "   - $GITHUB_USERNAME/$FRONTEND_REPO"
    echo "   - $GITHUB_USERNAME/$MAIN_REPO"
    echo ""
    echo "2. Run: ./migration-helper.sh push"
    echo ""
    echo "3. Test the setup:"
    echo "   cd $MAIN_REPO"
    echo "   ./scripts/dev-setup.sh"
}

# Handle command line arguments
case "${1:-}" in
    "push")
        push_repositories
        ;;
    "backend")
        create_backend_repo
        ;;
    "frontend")
        create_frontend_repo
        ;;
    "main")
        create_main_repo
        ;;
    *)
        main
        ;;
esac