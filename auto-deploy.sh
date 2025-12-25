#!/bin/bash
# Auto-deployment script - runs on server when GitHub pushes

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Auto-Deployment Started${NC}"
echo "Time: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Navigate to project directory
cd /root/islamic-soundcloud

# Pull latest changes
echo -e "${BLUE}📥 Step 1: Pulling latest code from GitHub...${NC}"
git pull origin main || git pull origin master
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Backend deployment
echo -e "${BLUE}🔧 Step 2: Updating backend files...${NC}"

# Copy migrations
if [ -d "laravel/migrations" ]; then
    echo "Copying migrations..."
    for file in laravel/migrations/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/database/migrations/"
            echo "  ✓ $(basename $file)"
        fi
    done
fi

# Copy models
if [ -d "laravel/models" ]; then
    echo "Copying models..."
    for file in laravel/models/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Models/"
            echo "  ✓ $(basename $file)"
        fi
    done
fi

# Copy controllers
if [ -d "laravel/controllers" ]; then
    echo "Copying controllers..."
    for file in laravel/controllers/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Http/Controllers/Api/"
            echo "  ✓ $(basename $file)"
        fi
    done
fi

# Copy jobs
if [ -d "laravel/jobs" ]; then
    echo "Copying jobs..."
    for file in laravel/jobs/*.php; do
        if [ -f "$file" ]; then
            docker cp "$file" "sc_app:/var/www/html/app/Jobs/"
            echo "  ✓ $(basename $file)"
        fi
    done
fi

# Copy routes
if [ -f "laravel/routes/api.php" ]; then
    echo "Copying routes..."
    docker cp "laravel/routes/api.php" "sc_app:/var/www/html/routes/api.php"
    echo "  ✓ api.php"
fi

# Copy providers
if [ -f "laravel/providers/AuthServiceProvider.php" ]; then
    echo "Copying providers..."
    docker cp "laravel/providers/AuthServiceProvider.php" "sc_app:/var/www/html/app/Providers/AuthServiceProvider.php"
    echo "  ✓ AuthServiceProvider.php"
fi

echo -e "${GREEN}✅ Backend files updated${NC}"
echo ""

# Update nginx config if changed
echo -e "${BLUE}🌐 Step 3: Checking nginx configuration...${NC}"
if [ -f "nginx.conf" ]; then
    docker cp nginx.conf sc_proxy:/etc/nginx/conf.d/default.conf
    docker compose restart proxy
    echo -e "${GREEN}✅ Nginx updated${NC}"
else
    echo -e "${YELLOW}⚠ No nginx.conf changes${NC}"
fi
echo ""

# Run migrations
echo -e "${BLUE}🗄️  Step 4: Running database migrations...${NC}"
docker compose exec -T app php artisan migrate --force 2>/dev/null || echo -e "${YELLOW}⚠ No new migrations${NC}"
echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# Clear Laravel cache
echo -e "${BLUE}🧹 Step 5: Clearing cache...${NC}"
docker compose exec -T app php artisan cache:clear 2>/dev/null
docker compose exec -T app php artisan config:clear 2>/dev/null
docker compose exec -T app php artisan route:clear 2>/dev/null
echo -e "${GREEN}✅ Cache cleared${NC}"
echo ""

# Optimize Laravel
echo -e "${BLUE}⚡ Step 6: Optimizing Laravel...${NC}"
docker compose exec -T app php artisan config:cache 2>/dev/null || true
docker compose exec -T app php artisan route:cache 2>/dev/null || true
echo -e "${GREEN}✅ Optimization complete${NC}"
echo ""

# Frontend deployment
echo -e "${BLUE}🎨 Step 7: Updating frontend...${NC}"
docker compose restart frontend
echo -e "${GREEN}✅ Frontend restarted${NC}"
echo ""

# Restart queue workers
echo -e "${BLUE}🔄 Step 8: Restarting queue workers...${NC}"
docker compose restart queue
echo -e "${GREEN}✅ Queue workers restarted${NC}"
echo ""

# Health check
echo -e "${BLUE}🏥 Step 9: Health check...${NC}"
sleep 5

# Check if API is responding
if curl -s http://localhost/api/health > /dev/null 2>&1 || curl -s http://localhost/api/categories > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${YELLOW}⚠ API might need attention${NC}"
fi

# Check service status
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "Time: $(date)"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend: http://185.250.36.33:5173"
echo "  Backend:  http://185.250.36.33/api"
echo ""

# Log deployment
echo "[$(date)] Deployment completed successfully" >> /root/islamic-soundcloud/deploy.log

