# 🎵 SoundCloud Clone - Islamic Audio Platform

A full-stack audio streaming platform built with Laravel (Backend) and React (Frontend), featuring audio upload, transcoding, user authentication, and admin moderation.

## 🌟 Features

### User Features
- 👤 User registration and authentication
- 🎵 Audio upload and streaming
- 💬 Comments on tracks
- ❤️ Like/unlike tracks
- 📋 Create and manage playlists
- 🔍 Search tracks and users
- 🔔 Notifications
- 📊 User profiles with follower system

### Admin Features
- ✅ Track approval/rejection system
- 🗑️ Track moderation and deletion
- 📊 User management
- 📈 Platform statistics

### Technical Features
- 🎧 Automatic audio transcoding (FFmpeg)
- 💾 S3-compatible object storage (MinIO)
- 🔄 Background job processing (Redis Queue)
- 🚀 RESTful API with Laravel Sanctum authentication
- 🐳 Fully dockerized development and production environment
- 🔄 GitHub Actions CI/CD for automatic deployment

## 🏗️ Tech Stack

### Backend
- **Framework:** Laravel 11
- **Database:** MySQL 8.0
- **Cache/Queue:** Redis
- **Storage:** MinIO (S3-compatible)
- **Audio Processing:** FFmpeg
- **Authentication:** Laravel Sanctum

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS (or custom CSS)
- **API Client:** Axios

### DevOps
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx
- **CI/CD:** GitHub Actions
- **Server:** Ubuntu (Contabo VPS)

## 📋 Prerequisites

- Docker & Docker Compose
- Git
- 2GB+ RAM
- 20GB+ storage

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/soundcloud-clone.git
cd soundcloud-clone

# Start all services
docker compose up -d

# Wait for services to initialize (30 seconds)
sleep 30

# Access the application
# Frontend: http://localhost:5173
# API: http://localhost/api
# phpMyAdmin: http://localhost:8080
# MinIO Console: http://localhost:9001
```

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete server setup instructions.

### GitHub Auto-Deployment

See [GITHUB_SETUP.md](GITHUB_SETUP.md) for setting up automatic deployment from GitHub.

**Quick version:** [QUICKSTART_GITHUB.md](QUICKSTART_GITHUB.md)

## 📂 Project Structure

```
soundcloud/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── services/       # API client
│   │   └── styles/         # CSS styles
│   └── vite.config.js
├── laravel/                # Laravel backend
│   ├── controllers/        # API controllers
│   ├── models/            # Eloquent models
│   ├── migrations/        # Database migrations
│   ├── jobs/              # Queue jobs
│   ├── routes/            # API routes
│   └── providers/         # Service providers
├── docker-compose.yml     # Docker services
├── nginx.conf             # Nginx configuration
├── deploy.sh              # Deployment script
├── auto-deploy.sh         # Auto-deployment script
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions workflow
```

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `app` | - | Laravel PHP-FPM application |
| `db` | 3306 | MySQL database |
| `redis` | 6379 | Redis cache & queue |
| `minio` | 9000, 9001 | S3-compatible object storage |
| `ffmpeg` | - | Audio transcoding service |
| `queue` | - | Laravel queue worker |
| `phpmyadmin` | 8080 | Database management |
| `frontend` | 5173 | React development server |
| `proxy` | 80, 443 | Nginx reverse proxy |

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `APP_KEY`: Laravel application key (auto-generated)
- `APP_URL`: Your server URL
- `DB_*`: Database credentials
- `AWS_*`: MinIO/S3 configuration
- `VITE_API_URL`: Frontend API endpoint

### First-Time Setup

```bash
# Generate app key
docker compose exec app php artisan key:generate

# Run migrations
docker compose exec app php artisan migrate

# Create admin user
docker compose exec app php artisan tinker
# In tinker:
$user = App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('your-secure-password'),
    'is_admin' => true
]);
App\Models\Profile::create(['user_id' => $user->id, 'display_name' => 'Admin']);
exit
```

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/register          - Register new user
POST /api/login             - Login user
POST /api/logout            - Logout user
POST /api/forgot-password   - Request password reset
POST /api/reset-password    - Reset password
```

### Track Endpoints

```
GET    /api/tracks          - List all approved tracks
GET    /api/tracks/{id}     - Get track details
POST   /api/tracks          - Upload new track (auth)
PUT    /api/tracks/{id}     - Update track (auth, owner)
DELETE /api/tracks/{id}     - Delete track (auth, owner/admin)
```

### User Endpoints

```
GET    /api/profile         - Get current user profile (auth)
PUT    /api/profile         - Update profile (auth)
GET    /api/users/{id}      - Get user profile
```

### Admin Endpoints

```
GET    /api/admin/tracks/pending    - List pending tracks
POST   /api/admin/tracks/{id}/approve - Approve track
POST   /api/admin/tracks/{id}/reject  - Reject track
DELETE /api/admin/tracks/{id}        - Delete any track
```

## 🔄 Development Workflow

### Local Development

```bash
# Start services
docker compose up -d

# Watch logs
docker compose logs -f app
docker compose logs -f frontend

# Run artisan commands
docker compose exec app php artisan [command]

# Access container shell
docker compose exec app bash
```

### Code Changes

```bash
# Backend changes - files are auto-synced via volumes
# No restart needed for most changes

# Frontend changes - Vite hot reload enabled
# Changes appear immediately

# To restart specific service
docker compose restart app
docker compose restart frontend
```

### With GitHub Auto-Deploy

```bash
# Make changes locally
# ... edit files ...

# Commit and push
git add .
git commit -m "Description of changes"
git push

# GitHub Actions automatically deploys to server
# Wait 1-2 minutes, then refresh browser
```

## 🧪 Testing

```bash
# Run backend tests (if configured)
docker compose exec app php artisan test

# Check service health
docker compose ps

# Test API endpoints
curl http://localhost/api/tracks
```

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker compose logs

# Restart services
docker compose down
docker compose up -d
```

### Database connection failed

```bash
# Verify database is running
docker compose ps db

# Check database logs
docker compose logs db

# Recreate database container
docker compose down
docker volume rm soundcloud_dbdata
docker compose up -d
```

### Audio upload fails

```bash
# Check storage permissions
docker compose exec app ls -la storage/

# Check MinIO status
docker compose logs minio

# Verify bucket exists
docker compose exec minio mc ls local/
```

### Frontend can't connect to API

```bash
# Check nginx proxy
docker compose logs proxy

# Verify API URL in frontend
cat frontend/.env

# Test API directly
curl http://localhost/api/health
```

## 📖 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub CI/CD setup
- [QUICKSTART_GITHUB.md](QUICKSTART_GITHUB.md) - Fast GitHub setup
- [PROJECT_PLAN.md](PROJECT_PLAN.md) - Project overview
- [INTERN_GUIDE.md](INTERN_GUIDE.md) - Intern onboarding
- [TESTING.md](TESTING.md) - Testing guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is for educational purposes.

## 👥 Team

- **Backend:** Laravel + Docker + FFmpeg
- **Frontend:** React + Vite
- **DevOps:** Docker Compose + GitHub Actions

## 🙏 Acknowledgments

- Laravel framework
- React library
- Docker for containerization
- MinIO for object storage
- FFmpeg for audio processing

---

## 🚀 Production URLs

- **Frontend:** http://185.250.36.33:5173
- **API:** http://185.250.36.33/api
- **phpMyAdmin:** http://185.250.36.33:8080
- **MinIO Console:** http://185.250.36.33:9001

## 📞 Support

For issues and questions:
1. Check documentation files
2. Review Docker logs: `docker compose logs -f`
3. Check GitHub Actions workflow status
4. Review server deployment logs: `/root/islamic-soundcloud/deploy.log`

---

**Built with ❤️ and ☕**

**الحمد لله - Alhamdulillah! 🕌**
