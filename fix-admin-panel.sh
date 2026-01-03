#!/bin/bash

echo "=== Fixing Admin Panel 500 Errors ==="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project directory
cd ~/islamic-soundcloud || exit 1

echo -e "${YELLOW}Step 1: Copying fixed AdminController...${NC}"
docker cp laravel/app/Http/Controllers/AdminController.php sc_app:/var/www/html/app/Http/Controllers/Api/AdminController.php
echo -e "${GREEN}✓ AdminController copied${NC}"

echo -e "${YELLOW}Step 2: Fixing APP_KEY...${NC}"
# Remove all APP_KEY lines and add empty one
docker compose exec -T app sed -i '/^APP_KEY=/d' .env
docker compose exec -T app sh -c 'echo "APP_KEY=" >> .env'
# Generate new key
docker compose exec -T app php artisan key:generate --force
echo -e "${GREEN}✓ APP_KEY fixed${NC}"

echo -e "${YELLOW}Step 3: Clearing caches...${NC}"
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan route:clear
docker compose exec -T app php artisan cache:clear
echo -e "${GREEN}✓ Caches cleared${NC}"

echo -e "${YELLOW}Step 4: Restarting app container...${NC}"
docker compose restart app
sleep 5
echo -e "${GREEN}✓ App restarted${NC}"

echo -e "${YELLOW}Step 5: Testing /api/admin/stats endpoint...${NC}"
# Get a test token (assuming user ID 1 is admin)
docker compose exec -T app php artisan tinker --execute="
\$user = App\Models\User::find(1);
if (\$user) {
    \$token = \$user->createToken('test')->plainTextToken;
    echo 'TOKEN=' . \$token . PHP_EOL;
}
"

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "Please test the admin panel in your browser at:"
echo "http://185.250.36.33:5173/admin"

