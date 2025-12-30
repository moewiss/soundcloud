#!/bin/bash

# Script to migrate new features (follows, comments, playlists)
# Run this after the initial setup to add new functionality

set -e

echo "🎵 SoundCloud Clone - Migrating New Features"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Copying new files...${NC}"

# Copy new migrations
echo -e "${BLUE}  - Copying migrations...${NC}"
docker cp "laravel/migrations/2024_01_01_000005_create_follows_table.php" "sc_app:/var/www/html/database/migrations/"
docker cp "laravel/migrations/2024_01_01_000006_create_comments_table.php" "sc_app:/var/www/html/database/migrations/"
docker cp "laravel/migrations/2024_01_01_000007_create_playlists_table.php" "sc_app:/var/www/html/database/migrations/"
docker cp "laravel/migrations/2024_01_01_000008_create_history_table.php" "sc_app:/var/www/html/database/migrations/"

# Copy updated models
echo -e "${BLUE}  - Copying models...${NC}"
docker cp "laravel/models/User.php" "sc_app:/var/www/html/app/Models/"
docker cp "laravel/models/Track.php" "sc_app:/var/www/html/app/Models/"
docker cp "laravel/models/Comment.php" "sc_app:/var/www/html/app/Models/"
docker cp "laravel/models/Playlist.php" "sc_app:/var/www/html/app/Models/"

# Copy updated controllers
echo -e "${BLUE}  - Copying controllers...${NC}"
docker cp "laravel/controllers/LikeController.php" "sc_app:/var/www/html/app/Http/Controllers/Api/"
docker cp "laravel/controllers/FollowController.php" "sc_app:/var/www/html/app/Http/Controllers/Api/"
docker cp "laravel/controllers/CommentController.php" "sc_app:/var/www/html/app/Http/Controllers/Api/"
docker cp "laravel/controllers/SearchController.php" "sc_app:/var/www/html/app/Http/Controllers/Api/"
docker cp "laravel/controllers/PlaylistController.php" "sc_app:/var/www/html/app/Http/Controllers/Api/"
docker cp "laravel/controllers/ProfileController.php" "sc_app:/var/www/html/app/Http/Controllers/Api/"
docker cp "laravel/controllers/TrackController.php" "sc_app:/var/www/html/app/Http/Controllers/Api/"

# Copy updated routes
echo -e "${BLUE}  - Copying routes...${NC}"
docker cp "laravel/routes/api.php" "sc_app:/var/www/html/routes/api.php"

echo -e "${GREEN}✅ Files copied${NC}"

# Run migrations
echo -e "${BLUE}🗄️  Running new migrations...${NC}"
docker compose exec -T app php artisan migrate --force

echo -e "${GREEN}✅ Migrations completed${NC}"

# Clear cache
echo -e "${BLUE}🧹 Clearing cache...${NC}"
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan cache:clear
docker compose exec -T app php artisan route:clear

echo -e "${GREEN}✅ Cache cleared${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Migration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "✨ New features available:"
echo -e "   - ❤️  Like/Unlike tracks"
echo -e "   - 👥 Follow/Unfollow users"
echo -e "   - 💬 Comment on tracks"
echo -e "   - 📝 Create playlists"
echo -e "   - 🔍 Search functionality"
echo -e "   - 📊 User profiles with stats"
echo ""
echo -e "${GREEN}Happy coding! 🎵${NC}"

