# Deployment Guide - Contabo Ubuntu Server

Complete step-by-step deployment guide for your SoundCloud clone on Contabo Ubuntu server.

## 📋 Prerequisites

- Fresh Ubuntu 20.04/22.04 server
- Root or sudo access
- Domain name pointed to server IP (optional)
- At least 2GB RAM, 20GB storage

## 🔧 Step 1: Server Preparation

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Required Packages

```bash
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    vim \
    htop \
    net-tools
```

### 1.3 Install Docker

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group (replace 'ubuntu' with your username)
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Important**: Log out and log back in for docker group membership to take effect!

### 1.4 Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optionally allow MinIO console
sudo ufw allow 9001/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## 📦 Step 2: Deploy Application

### 2.1 Create Project Directory

```bash
cd ~
mkdir soundcloud
cd soundcloud
```

### 2.2 Copy Project Files

Upload all your project files to this directory:
- `docker-compose.yml`
- `nginx.conf`
- `laravel/` directory with all files

Or clone from git:

```bash
git clone <your-repo-url> .
```

### 2.3 Create Storage Directories

```bash
mkdir -p storage-logs
chmod 777 storage-logs
```

### 2.4 Set Environment Variables

Create `.env` file in project root (for docker-compose):

```bash
cat > .env << 'EOF'
APP_KEY=
APP_URL=http://YOUR_SERVER_IP
EOF
```

### 2.5 Start Docker Services

```bash
docker compose up -d
```

Wait for all containers to start (may take 1-2 minutes):

```bash
docker compose ps
```

All services should show "running" status.

## 🎵 Step 3: Install Laravel

### 3.1 Create Laravel Project

```bash
docker compose exec app bash
composer create-project laravel/laravel . --prefer-dist
php artisan key:generate
exit
```

### 3.2 Update .env in Docker Compose

Copy the generated APP_KEY:

```bash
docker compose exec app grep APP_KEY .env
```

Update your main `.env` file with this key, then restart:

```bash
docker compose down
docker compose up -d
```

### 3.3 Install Dependencies

```bash
docker compose exec app composer require \
    league/flysystem-aws-s3-v3 \
    guzzlehttp/guzzle \
    laravel/sanctum
```

### 3.4 Publish Sanctum

```bash
docker compose exec app php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### 3.5 Configure Laravel Environment

```bash
docker compose exec app bash -c 'cat > .env' << 'EOF'
APP_NAME="SoundCloud Clone"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_URL=http://YOUR_SERVER_IP

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
REDIS_PORT=6379

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=sc_minio
AWS_SECRET_ACCESS_KEY=sc_minio_secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sc-bucket
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
EOF
```

**Important**: Replace `YOUR_GENERATED_KEY_HERE` and `YOUR_SERVER_IP` with actual values!

## 📂 Step 4: Setup Application Files

### 4.1 Copy Migrations

```bash
docker compose exec app bash
cd database/migrations
# Now paste migration files or use vim/nano to create them
exit
```

Or from host:

```bash
# Copy migration files
docker cp laravel/migrations/2024_01_01_000001_add_admin_to_users_table.php sc_app:/var/www/html/database/migrations/
docker cp laravel/migrations/2024_01_01_000002_create_profiles_table.php sc_app:/var/www/html/database/migrations/
docker cp laravel/migrations/2024_01_01_000003_create_tracks_table.php sc_app:/var/www/html/database/migrations/
docker cp laravel/migrations/2024_01_01_000004_create_likes_table.php sc_app:/var/www/html/database/migrations/
```

### 4.2 Copy Models

```bash
docker cp laravel/models/Profile.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/Track.php sc_app:/var/www/html/app/Models/
docker cp laravel/models/User.php sc_app:/var/www/html/app/Models/
```

### 4.3 Copy Controllers

```bash
# Create directory first
docker compose exec app mkdir -p app/Http/Controllers/Api

# Copy controllers
docker cp laravel/controllers/AuthController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/ProfileController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/TrackController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/LikeController.php sc_app:/var/www/html/app/Http/Controllers/Api/
docker cp laravel/controllers/AdminTrackController.php sc_app:/var/www/html/app/Http/Controllers/Api/
```

### 4.4 Copy Jobs

```bash
docker compose exec app mkdir -p app/Jobs
docker cp laravel/jobs/TranscodeTrack.php sc_app:/var/www/html/app/Jobs/
```

### 4.5 Copy Routes & Providers

```bash
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/api.php
docker cp laravel/providers/AuthServiceProvider.php sc_app:/var/www/html/app/Providers/AuthServiceProvider.php
```

### 4.6 Set Permissions

```bash
docker compose exec app bash -c "chown -R www-data:www-data /var/www/html && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache"
```

## 🗄️ Step 5: Setup Database & Storage

### 5.1 Run Migrations

```bash
docker compose exec app php artisan migrate
```

If prompted, confirm with 'yes'.

### 5.2 Setup MinIO

```bash
# Install MinIO client
docker compose exec minio sh -c "wget https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && mv mc /usr/bin/"

# Configure alias
docker compose exec minio mc alias set local http://localhost:9000 sc_minio sc_minio_secret

# Create bucket
docker compose exec minio mc mb local/sc-bucket

# Set policy (optional - for public access)
docker compose exec minio mc anonymous set download local/sc-bucket
```

Verify bucket creation:

```bash
docker compose exec minio mc ls local/
```

### 5.3 Create Admin User

```bash
docker compose exec app php artisan tinker
```

In tinker console:

```php
$user = App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@yourdomain.com',
    'password' => bcrypt('ChangeThisPassword123!'),
    'is_admin' => true
]);

App\Models\Profile::create([
    'user_id' => $user->id,
    'display_name' => 'Admin'
]);

echo "Admin created: " . $user->email;
exit
```

**Important**: Save these credentials securely!

## 🔍 Step 6: Testing

### 6.1 Test API

```bash
# Test public endpoint
curl http://YOUR_SERVER_IP/api/tracks

# Test registration
curl -X POST http://YOUR_SERVER_IP/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","password_confirmation":"password123"}'

# Test login
curl -X POST http://YOUR_SERVER_IP/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"ChangeThisPassword123!"}'
```

### 6.2 Upload Test Track

```bash
# Get token first from login response
TOKEN="your_token_here"

# Upload track
curl -X POST http://YOUR_SERVER_IP/api/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Track" \
  -F "description=Test upload" \
  -F "file=@/path/to/test.mp3"
```

### 6.3 Check Queue Processing

```bash
# Watch queue worker logs
docker compose logs -f queue

# Check track processing status
docker compose exec app php artisan tinker
```

In tinker:

```php
App\Models\Track::all();
exit
```

## 🔒 Step 7: Production Hardening

### 7.1 Setup HTTPS with Certbot

```bash
sudo apt install certbot python3-certbot-nginx

# Point your domain DNS A record to server IP first!

sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf to use SSL certificates
```

### 7.2 Environment Security

```bash
# Change database passwords
docker compose exec db mysql -u root -prootpass

# In MySQL:
ALTER USER 'sc_user'@'%' IDENTIFIED BY 'new_strong_password';
FLUSH PRIVILEGES;
exit
```

Update passwords in `.env` files and restart:

```bash
docker compose down
docker compose up -d
```

### 7.3 Setup Monitoring

```bash
# Install monitoring tools
docker run -d \
  --name=cadvisor \
  --restart=always \
  -p 8080:8080 \
  -v /:/rootfs:ro \
  -v /var/run:/var/run:ro \
  -v /sys:/sys:ro \
  -v /var/lib/docker/:/var/lib/docker:ro \
  gcr.io/cadvisor/cadvisor:latest
```

### 7.4 Setup Backups

Create backup script:

```bash
cat > ~/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T db mysqldump -u sc_user -psc_pass sc_app > $BACKUP_DIR/db_$DATE.sql

# Backup MinIO data
docker compose exec -T minio tar czf - /data > $BACKUP_DIR/minio_$DATE.tar.gz

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -
```

## 🎯 Step 8: Verify Everything

### 8.1 Check All Services

```bash
docker compose ps
```

All should be "Up" and healthy.

### 8.2 Check Logs

```bash
# App logs
docker compose logs app | tail -50

# Queue logs
docker compose logs queue | tail -50

# Database logs
docker compose logs db | tail -20
```

### 8.3 Test Full Upload Flow

1. Register new user
2. Login to get token
3. Upload a track
4. Check queue processes it
5. Login as admin
6. Approve the track
7. Fetch public tracks list
8. Verify track appears

## 🚀 Going Live Checklist

- [ ] Domain DNS pointing to server
- [ ] HTTPS configured
- [ ] Database passwords changed
- [ ] Admin account created
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Test uploads working
- [ ] Queue processing working
- [ ] Email setup (for notifications)
- [ ] Rate limiting configured
- [ ] Log rotation setup

## 🔄 Maintenance Commands

```bash
# View logs
docker compose logs -f

# Restart specific service
docker compose restart queue

# Update containers
docker compose pull
docker compose up -d

# Clear Laravel cache
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:clear

# Run migrations
docker compose exec app php artisan migrate

# Access database
docker compose exec db mysql -u sc_user -psc_pass sc_app

# Access MinIO console
# Visit: http://YOUR_SERVER_IP:9001
```

## ❓ Troubleshooting

### Issue: Can't connect to API

```bash
# Check nginx
docker compose logs proxy

# Check app container
docker compose logs app

# Verify port 80 is open
sudo netstat -tlnp | grep :80
```

### Issue: Tracks not processing

```bash
# Check queue worker
docker compose logs queue

# Manually run queue
docker compose exec app php artisan queue:work --once

# Check Redis connection
docker compose exec app php artisan redis:ping
```

### Issue: Upload fails

```bash
# Check storage permissions
docker compose exec app ls -la storage/

# Check MinIO
docker compose logs minio
docker compose exec minio mc ls local/sc-bucket
```

### Issue: Database connection failed

```bash
# Check MySQL is running
docker compose ps db

# Test connection
docker compose exec app php artisan tinker
# Then: DB::connection()->getPdo();
```

## 📞 Support

For issues, check:
1. Docker logs: `docker compose logs`
2. Laravel logs: `docker compose exec app tail -f storage/logs/laravel.log`
3. System resources: `docker stats`

---

🎉 **Congratulations! Your SoundCloud clone is now live!**

