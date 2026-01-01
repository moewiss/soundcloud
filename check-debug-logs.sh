#!/bin/bash
set -e

echo "=== CHECKING DEBUG LOGS ON SERVER ==="
echo ""

cd /root/islamic-soundcloud

echo "1. Reading backend debug logs from Laravel container..."
docker compose exec -T app cat /var/www/html/storage/logs/debug.log 2>/dev/null || echo "No backend debug logs yet"

echo ""
echo "2. Reading Laravel error logs..."
docker compose exec -T app tail -50 /var/www/html/storage/logs/laravel.log

echo ""
echo "=== END OF LOGS ==="

