#!/bin/bash
set -e

echo "🕌 Islamic SoundCloud - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root: sudo bash deploy.sh${NC}"
   exit 1
fi

echo -e "${BLUE}📋 Step 1: Cleaning up old installations...${NC}"
# Stop and remove all Docker containers
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Remove all Docker volumes (CAREFUL: This deletes all data!)
docker volume prune -f

# Remove all Docker images
docker image prune -a -f

# Clean up old files
rm -rf /var/www/* 2>/dev/null || true
rm -rf ~/soundcloud 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo -e "${BLUE}📦 Step 2: Installing Docker (if needed)...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose plugin if needed
if ! docker compose version &> /dev/null; then
    apt-get update
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi
echo ""

echo -e "${BLUE}🔧 Step 3: Configuring firewall...${NC}"
# Install UFW if not present
apt-get install -y ufw

# Configure firewall
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5173/tcp  # React dev server
ufw allow 8080/tcp  # phpMyAdmin
ufw allow 9001/tcp  # MinIO console
ufw status

echo -e "${GREEN}✅ Firewall configured${NC}"
echo ""

echo -e "${BLUE}📁 Step 4: Creating directories...${NC}"
cd /root
mkdir -p islamic-soundcloud
cd islamic-soundcloud

# Create storage directories
mkdir -p storage-logs app/storage/logs
chmod -R 777 storage-logs

echo -e "${GREEN}✅ Directories created${NC}"
echo ""

echo -e "${BLUE}⚠️  IMPORTANT: Upload project files now!${NC}"
echo "Please upload these files via FileZilla to: /root/islamic-soundcloud/"
echo "  - docker-compose.yml"
echo "  - nginx.conf"
echo "  - .env"
echo "  - laravel/ directory"
echo ""
echo -e "${YELLOW}Press Enter when files are uploaded...${NC}"
read

echo -e "${BLUE}🐳 Step 5: Starting Docker services...${NC}"
# Create .env if not exists
if [ ! -f .env ]; then
    echo "APP_KEY=" > .env
    echo "APP_URL=http://185.250.36.33" >> .env
fi

# Start Docker services
docker compose up -d

echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

echo -e "${BLUE}⏳ Waiting for services to be ready (30 seconds)...${NC}"
sleep 30
echo ""

echo -e "${BLUE}🎼 Step 6: Installing Laravel...${NC}"
# Check if Laravel is already installed
if [ ! -f "app/artisan" ]; then
    echo "Installing Laravel..."
    docker compose exec -T app composer create-project laravel/laravel . --prefer-dist --no-interaction
    echo -e "${GREEN}✅ Laravel installed${NC}"
else
    echo -e "${GREEN}✅ Laravel already installed${NC}"
fi
echo ""

echo -e "${BLUE}🔑 Step 7: Generating application key...${NC}"
docker compose exec -T app php artisan key:generate
APP_KEY=$(docker compose exec -T app grep APP_KEY .env | cut -d '=' -f2)
echo "APP_KEY=$APP_KEY" > .env.tmp
echo "APP_URL=http://185.250.36.33" >> .env.tmp
mv .env.tmp .env
echo -e "${GREEN}✅ App key generated${NC}"
echo ""

echo -e "${BLUE}📦 Step 8: Installing Laravel packages...${NC}"
docker compose exec -T app composer require \
    league/flysystem-aws-s3-v3 \
    guzzlehttp/guzzle \
    laravel/sanctum \
    --no-interaction

docker compose exec -T app php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --no-interaction
echo -e "${GREEN}✅ Packages installed${NC}"
echo ""

echo -e "${BLUE}⚙️  Step 9: Configuring Laravel environment...${NC}"
docker compose exec -T app bash << 'ENVEOF'
cat > .env << 'EOF'
APP_NAME="Islamic SoundCloud"
APP_ENV=production
APP_DEBUG=false
APP_KEY=$(grep APP_KEY .env | cut -d '=' -f2)
APP_URL=http://185.250.36.33

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
EOF
ENVEOF

# Fix the APP_KEY in .env
docker compose exec -T app sed -i "s|APP_KEY=.*|APP_KEY=$APP_KEY|g" .env

echo -e "${GREEN}✅ Laravel configured${NC}"
echo ""

echo -e "${BLUE}📂 Step 10: Copying application files...${NC}"
# Copy migrations
if [ -d "laravel/migrations" ]; then
    for file in laravel/migrations/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/database/migrations/"
            echo "Copied: $(basename $file)"
        fi
    done
fi

# Copy models
if [ -d "laravel/models" ]; then
    for file in laravel/models/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Models/"
            echo "Copied: $(basename $file)"
        fi
    done
fi

# Copy controllers
if [ -d "laravel/controllers" ]; then
    docker compose exec -T app mkdir -p app/Http/Controllers/Api
    for file in laravel/controllers/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Http/Controllers/Api/"
            echo "Copied: $(basename $file)"
        fi
    done
fi

# Copy jobs
if [ -d "laravel/jobs" ]; then
    docker compose exec -T app mkdir -p app/Jobs
    for file in laravel/jobs/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Jobs/"
            echo "Copied: $(basename $file)"
        fi
    done
fi

# Copy routes
if [ -f "laravel/routes/api.php" ]; then
    docker cp "laravel/routes/api.php" "sc_app:/var/www/html/routes/api.php"
    echo "Copied: api.php"
fi

# Copy providers
if [ -f "laravel/providers/AuthServiceProvider.php" ]; then
    docker cp "laravel/providers/AuthServiceProvider.php" "sc_app:/var/www/html/app/Providers/AuthServiceProvider.php"
    echo "Copied: AuthServiceProvider.php"
fi

echo -e "${GREEN}✅ Application files copied${NC}"
echo ""

echo -e "${BLUE}🔒 Step 11: Setting permissions...${NC}"
docker compose exec -T app chown -R www-data:www-data /var/www/html
docker compose exec -T app chmod -R 775 storage bootstrap/cache
echo -e "${GREEN}✅ Permissions set${NC}"
echo ""

echo -e "${BLUE}🪣 Step 12: Setting up MinIO storage...${NC}"
# Wait for MinIO to be ready
sleep 5

# Install MinIO client
docker compose exec -T minio sh -c "wget -q https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && mv mc /usr/bin/" 2>/dev/null || true

# Configure MinIO
docker compose exec -T minio mc alias set local http://localhost:9000 sc_minio sc_minio_secret 2>/dev/null || true

# Create bucket
docker compose exec -T minio mc mb local/sc-bucket 2>/dev/null || echo "Bucket already exists"

# Set download policy
docker compose exec -T minio mc anonymous set download local/sc-bucket 2>/dev/null || true

echo -e "${GREEN}✅ MinIO configured${NC}"
echo ""

echo -e "${BLUE}🗄️  Step 13: Running database migrations...${NC}"
docker compose exec -T app php artisan migrate --force
echo -e "${GREEN}✅ Database migrated${NC}"
echo ""

echo -e "${BLUE}👤 Step 14: Creating admin user...${NC}"
echo ""
echo -e "${YELLOW}Enter admin email [admin@islamicsoundcloud.com]:${NC}"
read ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@islamicsoundcloud.com}

echo -e "${YELLOW}Enter admin password [admin123]:${NC}"
read -s ADMIN_PASSWORD
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
echo ""

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

echo "✅ Admin created: " . \$user->email . "\n";
TINKEREOF

echo -e "${GREEN}✅ Admin user created${NC}"
echo ""

echo -e "${BLUE}📊 Step 15: Seeding categories...${NC}"
docker compose exec -T app php artisan tinker << 'SEEDEOF'
$categories = [
    ['name' => 'Quran Recitation', 'name_ar' => 'تلاوة القرآن', 'slug' => 'quran', 'icon' => '📖'],
    ['name' => 'Tafsir', 'name_ar' => 'تفسير', 'slug' => 'tafsir', 'icon' => '📚'],
    ['name' => 'Hadith', 'name_ar' => 'حديث', 'slug' => 'hadith', 'icon' => '📜'],
    ['name' => 'Islamic Lectures', 'name_ar' => 'محاضرات إسلامية', 'slug' => 'lectures', 'icon' => '🎤'],
    ['name' => 'Nasheeds', 'name_ar' => 'أناشيد', 'slug' => 'nasheeds', 'icon' => '🎵'],
    ['name' => 'Dua & Dhikr', 'name_ar' => 'دعاء وذكر', 'slug' => 'dua', 'icon' => '🤲'],
    ['name' => 'Fiqh', 'name_ar' => 'فقه', 'slug' => 'fiqh', 'icon' => '⚖️'],
    ['name' => 'Islamic History', 'name_ar' => 'التاريخ الإسلامي', 'slug' => 'history', 'icon' => '🏛️'],
    ['name' => 'Friday Khutbah', 'name_ar' => 'خطبة الجمعة', 'slug' => 'khutbah', 'icon' => '🕌'],
    ['name' => 'Podcasts', 'name_ar' => 'بودكاست', 'slug' => 'podcasts', 'icon' => '🎙️'],
];

foreach ($categories as $cat) {
    App\Models\Category::firstOrCreate(['slug' => $cat['slug']], $cat);
}

echo "✅ Categories seeded\n";
SEEDEOF

echo -e "${GREEN}✅ Categories seeded${NC}"
echo ""

echo -e "${BLUE}🔄 Step 16: Restarting services...${NC}"
docker compose restart
echo -e "${GREEN}✅ Services restarted${NC}"
echo ""

echo -e "${BLUE}✅ Step 17: Final checks...${NC}"
sleep 5

# Check service status
echo "Service Status:"
docker compose ps
echo ""

# Test API
echo "Testing API..."
curl -s http://localhost/api/categories > /dev/null && echo -e "${GREEN}✅ API responding${NC}" || echo -e "${RED}❌ API not responding${NC}"
echo ""

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📋 Access Information:${NC}"
echo ""
echo -e "🌐 Frontend:        ${GREEN}http://185.250.36.33:5173${NC}"
echo -e "🔌 Backend API:     ${GREEN}http://185.250.36.33/api${NC}"
echo -e "💾 phpMyAdmin:      ${GREEN}http://185.250.36.33:8080${NC}"
echo -e "📦 MinIO Console:   ${GREEN}http://185.250.36.33:9001${NC}"
echo ""
echo -e "${BLUE}👤 Admin Credentials:${NC}"
echo -e "   Email:    ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "   Password: ${GREEN}[the one you entered]${NC}"
echo ""
echo -e "${BLUE}💾 phpMyAdmin Login:${NC}"
echo -e "   Username: ${GREEN}sc_user${NC}"
echo -e "   Password: ${GREEN}sc_pass${NC}"
echo ""
echo -e "${BLUE}📦 MinIO Console Login:${NC}"
echo -e "   Username: ${GREEN}sc_minio${NC}"
echo -e "   Password: ${GREEN}sc_minio_secret${NC}"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "   View logs:        ${GREEN}docker compose logs -f${NC}"
echo -e "   Restart:          ${GREEN}docker compose restart${NC}"
echo -e "   Stop:             ${GREEN}docker compose down${NC}"
echo -e "   Start:            ${GREEN}docker compose up -d${NC}"
echo ""
echo -e "${YELLOW}📚 Next Steps:${NC}"
echo "1. Test login at http://185.250.36.33:5173"
echo "2. Upload a test track"
echo "3. Approve it via admin panel"
echo "4. Check phpMyAdmin to see the data"
echo "5. Read QUICKSTART.md for more info"
echo ""
echo -e "${GREEN}الحمد لله - Alhamdulillah! 🕌${NC}"
echo ""

