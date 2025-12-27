# Islamic SoundCloud - Deployment Guide

## 🚀 Quick Deployment

Your application is configured for automatic deployment via GitHub Actions. Follow these steps to deploy:

### 1. Commit and Push Frontend Files

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add complete frontend application"

# Push to GitHub (triggers automatic deployment)
git push origin main
```

### 2. Automatic Deployment Process

When you push to GitHub:
1. GitHub Actions workflow is triggered
2. Code is pulled to the server via SSH
3. Backend dependencies are installed
4. Frontend dependencies are installed and built
5. Docker containers are restarted
6. Application is live!

### 3. Manual Deployment (if needed)

If automatic deployment isn't set up yet, deploy manually:

```bash
# On your server (SSH into it)
ssh root@185.250.36.33

# Navigate to project
cd ~/islamic-soundcloud

# Pull latest changes
git pull origin main

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..

# Restart containers
docker compose down
docker compose up -d

# Check status
docker compose ps
```

## 🌐 Access URLs

- **Frontend**: http://185.250.36.33:5173
- **API**: http://185.250.36.33/api
- **phpMyAdmin**: http://185.250.36.33:8080
- **MinIO Console**: http://185.250.36.33:9001

## 👤 Admin Credentials

- **Email**: admin@islamicsoundcloud.com
- **Password**: admin123

## 📝 Next Steps After Deployment

1. **Test the Application**
   - Visit http://185.250.36.33:5173
   - Login with admin credentials
   - Upload a test track
   - Verify audio playback

2. **Configure MinIO**
   - Access MinIO at http://185.250.36.33:9001
   - Login: sc_minio / sc_minio_secret
   - Verify `sc-bucket` exists and is accessible

3. **Monitor Services**
   ```bash
   docker compose ps
   docker compose logs -f app
   docker compose logs -f frontend
   ```

4. **SSL/HTTPS Setup** (Recommended for Production)
   - Install Certbot
   - Obtain SSL certificates
   - Update nginx configuration

## 🔧 Troubleshooting

### Frontend Not Loading
```bash
docker compose logs frontend
docker compose restart frontend
```

### API Errors
```bash
docker compose logs app
docker compose exec app php artisan route:list
```

### Database Issues
```bash
docker compose logs db
docker compose exec app php artisan migrate:status
```

### Clear Cache
```bash
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear
```

## 📦 Services Overview

- **app**: Laravel 12 API (PHP 8.4)
- **frontend**: React + Vite SPA
- **db**: MySQL 8.0
- **redis**: Redis 7 (caching/queues)
- **minio**: S3-compatible storage
- **queue**: Laravel queue worker
- **proxy**: Nginx reverse proxy
- **phpmyadmin**: Database management UI

## 🎵 Features Implemented

✅ User authentication (register/login/logout)
✅ Track upload and management
✅ Audio player with queue
✅ User profiles
✅ Track likes and favorites
✅ Real-time search
✅ Admin panel
✅ S3 storage (MinIO)
✅ Queue processing for transcoding
✅ API authentication with Sanctum

## 🚧 Features Coming Soon

- Comments system
- Follow/Unfollow users
- Playlists management
- Notifications system
- Social sharing
- Advanced search filters

## 📞 Support

For issues or questions, check the logs:
```bash
docker compose logs --tail=100 -f
```
