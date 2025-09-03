# Family Connect - Backend API & Admin Dashboard

A comprehensive family communication platform with secure messaging, photo sharing, and mobile app distribution system.

## 📱 What is Family Connect?

Family Connect is a complete family communication solution featuring:

- **🔐 Secure Family Chat** - End-to-end encrypted messaging
- **📸 Photo Sharing** - AWS S3-powered image management
- **📅 Family Calendar** - Shared events and scheduling
- **📱 Mobile App Distribution** - Automated APK/IPA deployment via S3
- **👥 User Management** - Role-based access control
- **📊 Analytics Dashboard** - Usage tracking and insights
- **🌐 Real-time Features** - WebSocket communication via Laravel Reverb

---

## 🛠 Technology Stack

- **Backend**: Laravel 11 + PHP 8.2
- **Database**: MySQL 8.0
- **Cache/Queue**: Redis
- **Storage**: AWS S3
- **Real-time**: Laravel Reverb (WebSocket)
- **Frontend**: Tailwind CSS + Vanilla JS
- **Authentication**: Laravel Sanctum
- **File Management**: S3 with signed URLs

---

## 🚀 Installation & Setup

### Prerequisites

```bash
# Required software
- PHP 8.2 or higher
- Composer 2.x
- Node.js 18+ & NPM
- MySQL 8.0
- Redis Server
- AWS S3 Account (with bucket created)
```

### 1. Environment Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd family-connect-backend

# Install PHP dependencies
composer install

# Install Node dependencies (for Tailwind CSS)
npm install

# Create environment file
cp .env.example .env
```

### 2. Environment Configuration

Edit `.env` file with your settings:

```env
# Application
APP_NAME="Family Connect"
APP_ENV=production  # or local
APP_KEY=             # Will be generated
APP_DEBUG=false     # true for development
APP_URL=https://yourdomain.com

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=family_connect
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Redis Configuration (Cache & Sessions)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# AWS S3 Configuration (for file storage)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=your_region
AWS_BUCKET=your_bucket_name
AWS_URL=https://your_bucket.s3.your_region.amazonaws.com

# WebSocket Configuration (Real-time features)
BROADCAST_DRIVER=reverb
REVERB_APP_ID=family-connect
REVERB_APP_KEY=family-connect-key
REVERB_APP_SECRET=family-connect-secret
REVERB_HOST=ws.yourdomain.com
REVERB_PORT=443
REVERB_SCHEME=https

# File Upload Limits
UPLOAD_MAX_FILESIZE=500M
POST_MAX_SIZE=550M
MAX_EXECUTION_TIME=300
MEMORY_LIMIT=512M

# App Upload Settings (Optional)
APP_UPLOAD_MAX_SIZE=524288000    # 500MB
APP_UPLOAD_KEEP_VERSIONS=5       # Keep last 5 versions
APP_DOWNLOAD_URL_EXPIRY=30       # Minutes
```

### 3. Application Setup

```bash
# Generate application key
php artisan key:generate

# Create database and run migrations
php artisan migrate

# Seed the database with roles and admin user
php artisan db:seed

# Create symbolic link for public storage
php artisan storage:link

# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### 4. File Permissions (Linux/macOS)

```bash
# Set proper permissions
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
chown -R www-data:www-data storage/ bootstrap/cache/  # If using Apache/Nginx
```

### 5. Web Server Configuration

**For Apache (.htaccess already included)**:
```apache
# Ensure mod_rewrite is enabled
a2enmod rewrite
```

**For Nginx**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/family-connect-backend/public;
    
    index index.php index.html;
    
    # File upload size limits
    client_max_body_size 500M;
    client_body_timeout 300s;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        
        # PHP upload limits
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
    }
}
```

---

## 🔑 Default Admin Access

After running `php artisan db:seed`, you can login with:

- **Email**: `test@admin.com`
- **Password**: `123qwe@W`
- **Role**: System Administrator

**URLs to access:**
- **Main Site**: `https://yourdomain.com`
- **Admin Login**: `https://yourdomain.com/admin/login`
- **App Management**: `https://yourdomain.com/admin/apps`
- **Telescope Debug**: `https://yourdomain.com/telescope`

---

## 📱 Mobile App Management System

### Web Interface

Access the app management dashboard at `/admin/apps` to:

- ✅ Upload APK/IPA files to AWS S3
- ✅ Manage multiple versions per platform
- ✅ Set active download versions
- ✅ Track download statistics
- ✅ View upload history
- ✅ Clean up old versions

### CLI Commands

The system includes powerful CLI commands for automation:

#### Upload New App Version
```bash
# Upload Android APK
php artisan app:manage-uploads upload \
  --platform=android \
  --file=/path/to/your-app.apk \
  --version=1.2.0 \
  --build=42 \
  --notes="Bug fixes and new features"

# Upload iOS IPA
php artisan app:manage-uploads upload \
  --platform=ios \
  --file=/path/to/your-app.ipa \
  --version=1.2.0 \
  --build=42 \
  --notes="iOS release with improvements"
```

#### List All Uploads
```bash
# List all platforms
php artisan app:manage-uploads list

# List specific platform
php artisan app:manage-uploads list --platform=android
```

#### Version Management
```bash
# Set a version as active (for downloads)
php artisan app:manage-uploads activate --id=123

# Delete a version (cannot delete active version)
php artisan app:manage-uploads delete --id=456
```

#### Maintenance Commands
```bash
# View statistics and metrics
php artisan app:manage-uploads stats

# Clean up old versions (keeps last 5 by default)
php artisan app:manage-uploads cleanup --keep=3
```

---

## 🌐 Public Download URLs

Your users can download the latest apps via:

- **Android**: `https://yourdomain.com/download/android`
- **iOS**: `https://yourdomain.com/download/ios`

These URLs automatically redirect to secure S3 signed URLs that expire after 30 minutes.

### API Endpoints for Mobile Apps

```bash
# Get download URLs (JSON response)
GET /api/download/android
GET /api/download/ios

# Response format:
{
  "download_url": "https://s3-signed-url...",
  "platform": "android",
  "expires_in_minutes": 15,
  "available": true
}
```

---

## 🔧 Development Commands

### Database Management
```bash
# Fresh database with sample data
php artisan migrate:fresh --seed

# Run specific seeder
php artisan db:seed --class=RolesSeeder

# Create new migration
php artisan make:migration create_new_table

# Rollback migrations
php artisan migrate:rollback
```

### Cache Management
```bash
# Clear all caches
php artisan optimize:clear

# Cache configuration for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Queue Management
```bash
# Start queue worker
php artisan queue:work

# Start queue worker with auto-reload
php artisan queue:work --timeout=300 --tries=3

# Clear failed jobs
php artisan queue:flush
```

### Real-time Features (WebSocket)
```bash
# Start Reverb server for real-time features
php artisan reverb:start

# Start Reverb in background (production)
php artisan reverb:start --host=0.0.0.0 --port=8080
```

---

## 🐛 Debugging & Maintenance

### Debug Information
```bash
# View app upload configuration
curl https://yourdomain.com/admin/debug/s3

# Check system health
curl https://yourdomain.com/health
```

### Log Files
```bash
# View Laravel logs
tail -f storage/logs/laravel.log

# View upload-specific logs
tail -f storage/logs/laravel.log | grep "App upload"
```

### Storage Management
```bash
# Test S3 connection
php artisan tinker
>>> \Storage::disk('s3')->put('test.txt', 'Hello S3');
>>> \Storage::disk('s3')->exists('test.txt');
>>> \Storage::disk('s3')->delete('test.txt');
```

### Performance Monitoring
- **Telescope**: `/telescope` - Database queries, requests, jobs
- **Health Check**: `/health` - API status and version info
- **Statistics**: `/admin/statistics` - App download metrics

---

## 📁 Project Structure

```
family-connect-backend/
├── app/
│   ├── Console/Commands/          # CLI commands
│   ├── Http/Controllers/          # API & Web controllers
│   ├── Models/                    # Eloquent models
│   │   ├── Apps/                  # App upload models
│   │   ├── Users/                 # User management
│   │   └── Roles/                 # Role system
│   └── Services/                  # Business logic services
├── config/                        # Configuration files
├── database/
│   ├── migrations/                # Database schema
│   └── seeders/                   # Sample data
├── public/                        # Web accessible files
├── resources/
│   └── views/                     # Blade templates
├── routes/                        # Route definitions
└── storage/                       # Logs, cache, sessions
```

---

## 🔒 Security Features

- **🔐 Role-Based Access Control**: Admin, Moderator, Client roles
- **🛡️ Laravel Sanctum**: API authentication with tokens
- **🔗 Signed S3 URLs**: Temporary, secure download links
- **📝 Audit Logging**: Track all uploads and downloads
- **🚫 File Validation**: Size limits, type checking, hash verification
- **⏰ URL Expiration**: Download links expire automatically
- **🔍 Telescope Integration**: Monitor all application activity

---

## 🚀 Production Deployment

### Server Requirements
```bash
# Minimum server specs
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- PHP 8.2+ with extensions: mysql, redis, gd, zip, curl
- MySQL 8.0
- Redis 6.0+
- Nginx or Apache
```

### Production Optimization
```bash
# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer install --no-dev --optimize-autoloader

# Set up process monitoring
# Use supervisor for queue workers and Reverb server
```

### Backup Strategy
```bash
# Database backup
mysqldump family_connect > backup-$(date +%Y%m%d).sql

# S3 files are already backed up in AWS
# Consider S3 versioning and cross-region replication
```

---

## 🎯 Key Features Explained

### 📱 App Upload System
- Uploads APK/IPA files to AWS S3
- Tracks versions, build numbers, and metadata
- Generates secure download URLs with expiration
- Supports multiple versions with rollback capability
- Automated cleanup of old versions

### 👥 User Management
- Three-tier role system (Admin, Moderator, Client)
- Laravel Sanctum API authentication
- User registration with email verification
- Profile management with photo uploads

### 📊 Analytics & Monitoring
- Download tracking per version
- Storage usage monitoring
- Real-time statistics dashboard
- Laravel Telescope for debugging

### 🌐 API Integration
- RESTful API for mobile apps
- JSON responses for app downloads
- Signed URL generation for secure access
- Rate limiting and authentication

---

## 📞 Support & Maintenance

### Common Issues

**File Upload Fails**:
```bash
# Check PHP upload limits
php -i | grep upload_max_filesize
php -i | grep post_max_size

# Check disk space
df -h

# Check S3 permissions
aws s3 ls s3://your-bucket-name/apps/
```

**Database Connection Issues**:
```bash
# Test database connection
php artisan tinker
>>> \DB::connection()->getPdo();
```

**Performance Issues**:
```bash
# Enable query logging
php artisan tinker
>>> \DB::enableQueryLog();

# Check Redis connection
redis-cli ping
```

### Updating the System
```bash
# Pull latest changes
git pull origin main

# Update dependencies
composer update
npm update

# Run migrations
php artisan migrate

# Clear caches
php artisan optimize:clear
```

---

## 📝 License

The Family Connect backend is open-source software licensed under the [MIT license](https://opensource.org/licenses/MIT).

---

**🎉 Your Family Connect platform is now ready! Access the admin dashboard at `/admin/apps` to start uploading your mobile applications.**