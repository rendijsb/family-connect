FROM php:8.2-fpm

WORKDIR /var/www/html

RUN echo "memory_limit = 512M" > /usr/local/etc/php/conf.d/memory-limit.ini
RUN echo "upload_max_filesize = 500M" > /usr/local/etc/php/conf.d/upload-limits.ini
RUN echo "post_max_size = 500M" >> /usr/local/etc/php/conf.d/upload-limits.ini
RUN echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/upload-limits.ini

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    supervisor \
    nginx \
    && pecl install redis \
    && docker-php-ext-enable redis

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY composer.* ./

RUN chown -R www-data:www-data /var/www/html

COPY . .

RUN composer install --no-scripts --no-autoloader

RUN composer dump-autoload --optimize

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 storage bootstrap/cache

RUN php artisan storage:link

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=8000
