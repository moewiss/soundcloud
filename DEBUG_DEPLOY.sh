#!/bin/bash
echo "🔍 DEBUGGING DEPLOYMENT..."
echo "================================"

cd /root/islamic-soundcloud

echo "1️⃣  Checking git status..."
git status
echo ""

echo "2️⃣  Checking latest commit..."
git log --oneline -1
echo ""

echo "3️⃣  Pulling latest changes..."
git pull origin main
echo ""

echo "4️⃣  Clearing npm cache..."
cd frontend
npm cache clean --force
echo ""

echo "5️⃣  Reinstalling dependencies (just in case)..."
npm install
echo ""

echo "6️⃣  Building frontend..."
npm run build
echo ""

echo "7️⃣  Checking build output..."
ls -lh dist/
echo ""

echo "8️⃣  Restarting ALL containers..."
cd ..
docker compose restart
echo ""

echo "9️⃣  Checking container status..."
docker compose ps
echo ""

echo "🔟 Checking frontend logs..."
docker compose logs frontend --tail 20
echo ""

echo "================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Now try:"
echo "1. Open http://185.250.36.33:5173"
echo "2. Press Ctrl+Shift+Delete to clear browser cache"
echo "3. Press F12 and check Console tab for errors"
echo "4. Send screenshot of any red errors"

