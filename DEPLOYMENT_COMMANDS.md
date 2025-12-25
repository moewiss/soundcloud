# 🚀 Deployment Commands for Your Server

**Server IP:** 185.250.36.33  
**User:** root  
**Password:** GNCWrcDCPkOZJpNQip9l

---

## 📋 Step-by-Step Instructions

### Step 1: Upload Files via FileZilla

**FileZilla Settings:**
```
Host: 185.250.36.33
Username: root
Password: GNCWrcDCPkOZJpNQip9l
Port: 22
```

**Upload these files/folders to:** `/root/islamic-soundcloud/`

```
Upload:
✅ docker-compose.yml
✅ nginx.conf
✅ .env
✅ deploy.sh
✅ setup.sh
✅ laravel/ (entire folder)
✅ All documentation files (optional)
```

---

### Step 2: Connect to Server via SSH

**Windows (PowerShell):**
```powershell
ssh root@185.250.36.33
# Enter password: GNCWrcDCPkOZJpNQip9l
```

**Mac/Linux (Terminal):**
```bash
ssh root@185.250.36.33
# Enter password: GNCWrcDCPkOZJpNQip9l
```

---

### Step 3: Run Deployment Script

Once connected to your server, run these commands:

```bash
# Navigate to project directory
cd /root/islamic-soundcloud

# Make script executable
chmod +x deploy.sh

# Run deployment
bash deploy.sh
```

**The script will:**
1. ✅ Clean old Docker containers
2. ✅ Install Docker (if needed)
3. ✅ Configure firewall
4. ✅ Start all services
5. ✅ Install Laravel
6. ✅ Setup database
7. ✅ Create admin user
8. ✅ Seed categories
9. ✅ Test everything

**Time:** 10-15 minutes

---

### Step 4: Access Your Platform

After deployment completes, access at:

```
🌐 Frontend (React):    http://185.250.36.33:5173
🔌 Backend API:         http://185.250.36.33/api
💾 phpMyAdmin:          http://185.250.36.33:8080
📦 MinIO Console:       http://185.250.36.33:9001
```

---

## 🔧 Manual Commands (If Script Fails)

If the auto script fails, run these commands manually:

### 1. Clean Server
```bash
# Stop all Docker containers
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Remove volumes
docker volume prune -f

# Remove images
docker image prune -a -f
```

### 2. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install -y docker-compose-plugin
```

### 3. Start Services
```bash
cd /root/islamic-soundcloud
docker compose up -d
```

### 4. Wait for Services
```bash
# Wait 30 seconds for containers to start
sleep 30

# Check status
docker compose ps
```

### 5. Install Laravel
```bash
docker compose exec app composer create-project laravel/laravel . --prefer-dist
docker compose exec app php artisan key:generate
```

### 6. Install Packages
```bash
docker compose exec app composer require \
    league/flysystem-aws-s3-v3 \
    guzzlehttp/guzzle \
    laravel/sanctum

docker compose exec app php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### 7. Configure Laravel
```bash
docker compose exec app bash -c 'cat > .env << "EOF"
APP_NAME="Islamic SoundCloud"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_KEY_HERE
APP_URL=http://185.250.36.33

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=sc_app
DB_USERNAME=sc_user
DB_PASSWORD=sc_pass

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=redis

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sc_minio
AWS_SECRET_ACCESS_KEY=sc_minio_secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sc-bucket
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
EOF'
```

### 8. Copy Application Files
```bash
# Copy migrations
docker cp laravel/migrations/. sc_app:/var/www/html/database/migrations/

# Copy models
docker cp laravel/models/. sc_app:/var/www/html/app/Models/

# Copy controllers
docker compose exec app mkdir -p app/Http/Controllers/Api
docker cp laravel/controllers/. sc_app:/var/www/html/app/Http/Controllers/Api/

# Copy jobs
docker compose exec app mkdir -p app/Jobs
docker cp laravel/jobs/. sc_app:/var/www/html/app/Jobs/

# Copy routes
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/api.php

# Copy providers
docker cp laravel/providers/AuthServiceProvider.php sc_app:/var/www/html/app/Providers/
```

### 9. Set Permissions
```bash
docker compose exec app chown -R www-data:www-data /var/www/html
docker compose exec app chmod -R 775 storage bootstrap/cache
```

### 10. Setup MinIO
```bash
# Install MinIO client
docker compose exec minio sh -c "wget https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && mv mc /usr/bin/"

# Configure
docker compose exec minio mc alias set local http://localhost:9000 sc_minio sc_minio_secret

# Create bucket
docker compose exec minio mc mb local/sc-bucket

# Set policy
docker compose exec minio mc anonymous set download local/sc-bucket
```

### 11. Run Migrations
```bash
docker compose exec app php artisan migrate --force
```

### 12. Create Admin User
```bash
docker compose exec app php artisan tinker
```

Then in tinker:
```php
$user = App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@islamicsoundcloud.com',
    'password' => bcrypt('YourSecurePassword123'),
    'is_admin' => true
]);

App\Models\Profile::create([
    'user_id' => $user->id,
    'display_name' => 'Admin'
]);

exit
```

### 13. Seed Categories
```bash
docker compose exec app php artisan tinker
```

Then in tinker:
```php
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
    App\Models\Category::create($cat);
}

exit
```

---

## 🧪 Testing

### Test API
```bash
curl http://185.250.36.33/api/categories
```

### Test Registration
```bash
curl -X POST http://185.250.36.33/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### Check Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f queue
docker compose logs -f db
```

---

## 🔧 Useful Commands

### Restart Services
```bash
docker compose restart
```

### Stop Everything
```bash
docker compose down
```

### Start Everything
```bash
docker compose up -d
```

### Access App Container
```bash
docker compose exec app bash
```

### Access Database
```bash
docker compose exec db mysql -u sc_user -psc_pass sc_app
```

### Clear Laravel Cache
```bash
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear
```

### Run Queue Worker Manually
```bash
docker compose exec app php artisan queue:work
```

---

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker compose logs

# Restart Docker
systemctl restart docker
docker compose up -d
```

### Can't Access Website
```bash
# Check firewall
ufw status

# Open ports
ufw allow 80/tcp
ufw allow 5173/tcp
ufw allow 8080/tcp

# Check if services are running
docker compose ps
```

### Database Connection Failed
```bash
# Check database is running
docker compose ps db

# Restart database
docker compose restart db

# Check logs
docker compose logs db
```

### File Upload Fails
```bash
# Check permissions
docker compose exec app ls -la storage/

# Fix permissions
docker compose exec app chmod -R 775 storage
docker compose exec app chown -R www-data:www-data storage
```

### Audio Not Processing
```bash
# Check queue worker
docker compose logs queue

# Restart queue
docker compose restart queue

# Check MinIO
docker compose logs minio
docker compose exec minio mc ls local/sc-bucket
```

---

## 📊 Server Info

```
IP Address:     185.250.36.33
Username:       root
Password:       GNCWrcDCPkOZJpNQip9l

Services:
- Frontend:     Port 5173
- API:          Port 80
- phpMyAdmin:   Port 8080
- MinIO:        Port 9000, 9001
- MySQL:        Port 3306 (internal)
- Redis:        Port 6379 (internal)
```

---

## ✅ Post-Deployment Checklist

- [ ] All Docker containers running
- [ ] Can access frontend (http://185.250.36.33:5173)
- [ ] Can access API (http://185.250.36.33/api/categories)
- [ ] Can access phpMyAdmin (http://185.250.36.33:8080)
- [ ] Can login as admin
- [ ] Can register new user
- [ ] Can upload audio file
- [ ] Can see pending tracks in admin
- [ ] Can approve track
- [ ] Can stream audio
- [ ] Categories are populated
- [ ] Queue worker is processing jobs

---

## 🔐 Security Notes

**After deployment, consider:**

1. **Change Default Passwords**
```bash
# Change database password
docker compose exec db mysql -u root -prootpass
ALTER USER 'sc_user'@'%' IDENTIFIED BY 'NEW_STRONG_PASSWORD';
FLUSH PRIVILEGES;
```

2. **Setup HTTPS (Let's Encrypt)**
```bash
apt install certbot python3-certbot-nginx
certbot certonly --standalone -d yourdomain.com
```

3. **Limit Port Access**
```bash
# Close dev ports in production
ufw deny 5173/tcp  # Close React dev server
ufw deny 8080/tcp  # Close phpMyAdmin (use SSH tunnel instead)
```

4. **Enable Production Mode**
```bash
# Edit .env in app container
APP_DEBUG=false
APP_ENV=production
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker compose logs -f`
2. Review QUICKSTART.md
3. Review DEPLOYMENT.md  
4. Check service status: `docker compose ps`

---

**الحمد لله - Deployment Complete! 🕌**

