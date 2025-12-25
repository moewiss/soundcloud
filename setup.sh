#!/bin/bash

# SoundCloud Clone - Quick Setup Script
# Run this on your Ubuntu server after uploading project files

set -e

echo "🎵 SoundCloud Clone - Quick Setup"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please don't run as root. Run as your normal user with sudo access.${NC}"
   exit 1
fi

# Step 1: Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}📦 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
    echo -e "${RED}⚠️  Please log out and log back in, then run this script again!${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Check docker compose
if ! docker compose version &> /dev/null; then
    echo -e "${BLUE}📦 Installing Docker Compose plugin...${NC}"
    sudo apt update
    sudo apt install -y docker-compose-plugin
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Step 2: Create directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p storage-logs
chmod 777 storage-logs
mkdir -p app
echo -e "${GREEN}✅ Directories created${NC}"

# Step 3: Generate APP_KEY placeholder
echo -e "${BLUE}🔑 Setting up environment...${NC}"
if [ ! -f .env ]; then
    cat > .env << 'EOF'
APP_KEY=
APP_URL=http://localhost
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Step 4: Start Docker services
echo -e "${BLUE}🐳 Starting Docker containers...${NC}"
docker compose up -d

echo -e "${BLUE}⏳ Waiting for containers to be ready...${NC}"
sleep 10

# Step 5: Install Laravel
echo -e "${BLUE}🎼 Installing Laravel...${NC}"

# Check if Laravel is already installed
if [ ! -f "app/artisan" ]; then
    docker compose exec -T app composer create-project laravel/laravel . --prefer-dist --no-interaction
    echo -e "${GREEN}✅ Laravel installed${NC}"
else
    echo -e "${GREEN}✅ Laravel already installed${NC}"
fi

# Generate APP_KEY
echo -e "${BLUE}🔑 Generating application key...${NC}"
docker compose exec -T app php artisan key:generate

# Get the generated key
APP_KEY=$(docker compose exec -T app grep APP_KEY .env | cut -d '=' -f2)

# Update main .env
sed -i "s|APP_KEY=|APP_KEY=$APP_KEY|g" .env

# Step 6: Install packages
echo -e "${BLUE}📦 Installing Laravel packages...${NC}"
docker compose exec -T app composer require \
    league/flysystem-aws-s3-v3 \
    guzzlehttp/guzzle \
    laravel/sanctum \
    --no-interaction

# Publish Sanctum
docker compose exec -T app php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --no-interaction

# Step 7: Configure Laravel .env
echo -e "${BLUE}⚙️  Configuring Laravel environment...${NC}"
docker compose exec -T app bash -c "cat > .env << 'ENVEOF'
APP_NAME=\"SoundCloud Clone\"
APP_ENV=production
APP_DEBUG=false
APP_KEY=$APP_KEY
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=sc_app
DB_USERNAME=sc_user
DB_PASSWORD=sc_pass

BROADCAST_DRIVER=log
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

REDIS_HOST=redis
REDIS_PORT=6379

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sc_minio
AWS_SECRET_ACCESS_KEY=sc_minio_secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sc-bucket
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
ENVEOF
"

# Step 8: Copy application files
echo -e "${BLUE}📝 Copying application files...${NC}"

# Migrations
if [ -d "laravel/migrations" ]; then
    docker compose exec -T app mkdir -p database/migrations
    for file in laravel/migrations/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/database/migrations/"
        fi
    done
    echo -e "${GREEN}✅ Migrations copied${NC}"
fi

# Models
if [ -d "laravel/models" ]; then
    for file in laravel/models/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Models/"
        fi
    done
    echo -e "${GREEN}✅ Models copied${NC}"
fi

# Controllers
if [ -d "laravel/controllers" ]; then
    docker compose exec -T app mkdir -p app/Http/Controllers/Api
    for file in laravel/controllers/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Http/Controllers/Api/"
        fi
    done
    echo -e "${GREEN}✅ Controllers copied${NC}"
fi

# Jobs
if [ -d "laravel/jobs" ]; then
    docker compose exec -T app mkdir -p app/Jobs
    for file in laravel/jobs/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Jobs/"
        fi
    done
    echo -e "${GREEN}✅ Jobs copied${NC}"
fi

# Routes
if [ -f "laravel/routes/api.php" ]; then
    docker cp "laravel/routes/api.php" "sc_app:/var/www/html/routes/api.php"
    echo -e "${GREEN}✅ Routes copied${NC}"
fi

# Providers
if [ -f "laravel/providers/AuthServiceProvider.php" ]; then
    docker cp "laravel/providers/AuthServiceProvider.php" "sc_app:/var/www/html/app/Providers/AuthServiceProvider.php"
    echo -e "${GREEN}✅ Providers copied${NC}"
fi

# Step 9: Set permissions
echo -e "${BLUE}🔒 Setting permissions...${NC}"
docker compose exec -T app chown -R www-data:www-data /var/www/html
docker compose exec -T app chmod -R 775 storage bootstrap/cache

# Step 10: Setup MinIO
echo -e "${BLUE}🪣 Setting up MinIO storage...${NC}"
docker compose exec -T minio sh -c "wget -q https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && mv mc /usr/bin/" || true
docker compose exec -T minio mc alias set local http://localhost:9000 sc_minio sc_minio_secret 2>/dev/null || true
docker compose exec -T minio mc mb local/sc-bucket 2>/dev/null || echo "Bucket already exists"
docker compose exec -T minio mc anonymous set download local/sc-bucket 2>/dev/null || true
echo -e "${GREEN}✅ MinIO configured${NC}"

# Step 11: Run migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker compose exec -T app php artisan migrate --force
echo -e "${GREEN}✅ Database migrated${NC}"

# Step 12: Create admin user
echo -e "${BLUE}👤 Creating admin user...${NC}"
echo ""
read -p "Enter admin email [admin@example.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""
ADMIN_PASSWORD=${ADMIN_PASSWORD:-password123}

docker compose exec -T app php artisan tinker << TINKEREOF
\$user = App\Models\User::create([
    'name' => 'Admin',
    'email' => '$ADMIN_EMAIL',
    'password' => bcrypt('$ADMIN_PASSWORD'),
    'is_admin' => true
]);

App\Models\Profile::create([
    'user_id' => \$user->id,
    'display_name' => 'Admin'
]);

echo "Admin user created: " . \$user->email . "\n";
TINKEREOF

echo -e "${GREEN}✅ Admin user created${NC}"

# Step 13: Final steps
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📋 Admin Credentials:"
echo -e "   Email: ${BLUE}$ADMIN_EMAIL${NC}"
echo -e "   Password: ${BLUE}[the one you entered]${NC}"
echo ""
echo -e "🌐 Access your application:"
echo -e "   API: ${BLUE}http://$(hostname -I | awk '{print $1}')/api/tracks${NC}"
echo -e "   MinIO Console: ${BLUE}http://$(hostname -I | awk '{print $1}'):9001${NC}"
echo -e "      User: sc_minio / Pass: sc_minio_secret"
echo ""
echo -e "📚 Next steps:"
echo -e "   1. Update APP_URL in .env with your domain/IP"
echo -e "   2. Setup HTTPS (see DEPLOYMENT.md)"
echo -e "   3. Test API endpoints (see TESTING.md)"
echo -e "   4. Build your frontend!"
echo ""
echo -e "🔧 Useful commands:"
echo -e "   View logs: ${BLUE}docker compose logs -f${NC}"
echo -e "   Restart: ${BLUE}docker compose restart${NC}"
echo -e "   Stop: ${BLUE}docker compose down${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🎵${NC}"

