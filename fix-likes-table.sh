#!/bin/bash
# Fix the likes table - add missing updated_at column

set -e

echo "🔧 Fixing Likes Table..."
echo "========================"

# 1. Pull latest code
echo "📋 Step 1: Pulling latest code..."
git pull origin main

# 2. Copy the fixed migration
echo "📋 Step 2: Copying fixed migration..."
docker cp laravel/migrations/2024_01_01_000004_create_likes_table.php sc_app:/var/www/html/database/migrations/

# 3. Add missing updated_at column
echo "📋 Step 3: Adding updated_at column to likes table..."
docker compose exec app php artisan tinker --execute="
use Illuminate\Support\Facades\DB;

// Add updated_at column
DB::statement('ALTER TABLE likes ADD COLUMN updated_at TIMESTAMP NULL AFTER created_at');
echo 'Added updated_at column to likes table\n';
"

# 4. Clear cache
echo "📋 Step 4: Clearing cache..."
docker compose exec app php artisan optimize:clear

# 5. Restart app
echo "📋 Step 5: Restarting app..."
docker compose restart app

echo ""
echo "✅ Likes table fixed!"
echo "====================="
echo ""
echo "🧪 Now test the like button in your browser!"
echo ""
echo "The likes table now has both created_at and updated_at columns."

