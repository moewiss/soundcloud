#!/bin/bash
echo "🚨 DEPLOYING CRITICAL HOTFIX..."
echo "================================"
cd /root/islamic-soundcloud

echo "📥 Pulling latest fix..."
git pull origin main

echo "🏗️  Rebuilding frontend..."
cd frontend
npm run build

echo "🔄 Restarting services..."
cd ..
docker compose restart frontend

echo ""
echo "✅ HOTFIX DEPLOYED!"
echo "================================"
echo "The blank page issue is now fixed."
echo "Please refresh your browser (Ctrl+Shift+R)"
echo ""
echo "Test: http://185.250.36.33:5173"

