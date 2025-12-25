# 🚀 Quick Start Guide - Islamic SoundCloud

Get your Islamic SoundCloud platform running in **30 minutes**.

---

## 📋 What You'll Have

After following this guide:
- ✅ Complete backend API (Laravel + MySQL)
- ✅ React frontend
- ✅ phpMyAdmin for database management
- ✅ MinIO for file storage
- ✅ Audio upload & transcoding
- ✅ Admin moderation panel
- ✅ User authentication
- ✅ Audio streaming

---

## 🖥️ Server Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 40GB storage
- Ubuntu 20.04 or 22.04

**Your Contabo Server:** Perfect! ✅

---

## 🎯 Installation (On Your Server)

### Step 1: Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
# or
ssh username@YOUR_SERVER_IP
```

### Step 2: Run Auto-Setup Script

```bash
# Create project directory
mkdir -p ~/islamic-soundcloud
cd ~/islamic-soundcloud

# Download setup files
# (Upload your project files via SFTP, Git, or SCP)

# Make setup script executable
chmod +x setup.sh

# Run setup (will take ~10 minutes)
./setup.sh
```

The script will:
1. ✅ Install Docker
2. ✅ Set up all containers
3. ✅ Install Laravel
4. ✅ Create database
5. ✅ Set up MinIO storage
6. ✅ Create admin user

### Step 3: Access Your Platform

```
🌐 Frontend:      http://YOUR_SERVER_IP:5173
🔌 Backend API:   http://YOUR_SERVER_IP/api
💾 phpMyAdmin:    http://YOUR_SERVER_IP:8080
📦 MinIO Console: http://YOUR_SERVER_IP:9001

Default Admin:
📧 Email: admin@islamicsoundcloud.com
🔑 Password: (you'll set during setup)

phpMyAdmin Login:
👤 Username: sc_user
🔑 Password: sc_pass

MinIO Console Login:
👤 Username: sc_minio
🔑 Password: sc_minio_secret
```

---

## 🧪 Test Your Installation

### 1. Test Backend API

```bash
# List categories
curl http://YOUR_SERVER_IP/api/categories

# Register a user
curl -X POST http://YOUR_SERVER_IP/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### 2. Test Frontend

Open browser: `http://YOUR_SERVER_IP:5173`

You should see:
- ✅ Home page with categories
- ✅ Login/Register buttons
- ✅ Navigation menu

### 3. Test Upload

1. Login as admin
2. Go to Upload page
3. Select an audio file (MP3 or WAV)
4. Fill in title and description
5. Click Upload
6. Go to Admin Dashboard → Pending Tracks
7. Approve the track
8. Track should now appear on home page

### 4. Test phpMyAdmin

1. Open `http://YOUR_SERVER_IP:8080`
2. Login with: `sc_user` / `sc_pass`
3. You should see `sc_app` database
4. Browse `tracks`, `users`, `categories` tables

---

## 🔧 Common Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f app      # Backend
docker compose logs -f queue    # Queue worker
docker compose logs -f db       # Database
docker compose logs -f frontend # React app

# Restart services
docker compose restart app
docker compose restart queue
docker compose restart frontend

# Stop everything
docker compose down

# Start everything
docker compose up -d

# Check service status
docker compose ps

# Access Laravel container
docker compose exec app bash

# Access database
docker compose exec db mysql -u sc_user -psc_pass sc_app

# Run Laravel commands
docker compose exec app php artisan migrate
docker compose exec app php artisan cache:clear
docker compose exec app php artisan queue:work
```

---

## 🎨 Customize Your Platform

### 1. Update Branding

```bash
# Edit frontend/.env
VITE_APP_NAME="Your Platform Name"
VITE_APP_TAGLINE="Islamic Audio Platform"

# Restart frontend
docker compose restart frontend
```

### 2. Change Colors

Edit `frontend/src/styles/theme.js`:

```javascript
export const theme = {
  colors: {
    primary: '#2E7D32',    // Islamic Green
    secondary: '#FFA726',  // Gold
    // Change these to your brand colors
  }
}
```

### 3. Add Your Logo

```bash
# Replace logo file
cp your-logo.svg frontend/public/logo.svg

# Restart frontend
docker compose restart frontend
```

### 4. Update Categories

```bash
# Access database via phpMyAdmin or:
docker compose exec app php artisan tinker
```

```php
// Add new category
App\Models\Category::create([
    'name' => 'Seerah',
    'name_ar' => 'السيرة النبوية',
    'slug' => 'seerah',
    'icon' => '🕌'
]);
```

---

## 📱 Next Steps

### Week 1: Setup & Test
- [ ] Complete installation
- [ ] Test all features
- [ ] Upload 10 test tracks
- [ ] Create test user accounts
- [ ] Customize branding

### Week 2: Content & Configuration
- [ ] Add more categories
- [ ] Set up backup system
- [ ] Configure email settings
- [ ] Add sample content
- [ ] Test on mobile devices

### Week 3: Team Onboarding
- [ ] Share access with interns
- [ ] Assign first tasks
- [ ] Set up development environments
- [ ] Code review process
- [ ] Communication channels

### Week 4: Public Launch
- [ ] Get SSL certificate (HTTPS)
- [ ] Set up domain name
- [ ] Performance testing
- [ ] Security audit
- [ ] Soft launch with beta users

---

## 🔒 Security Checklist

Before going public:

```bash
# 1. Change default passwords
# Edit .env and update:
DB_PASSWORD=NEW_STRONG_PASSWORD
AWS_SECRET_ACCESS_KEY=NEW_MINIO_SECRET

# 2. Set up firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# 3. Set up SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 4. Disable debug mode
# In .env:
APP_DEBUG=false
APP_ENV=production

# 5. Set up backups (see DEPLOYMENT.md)
```

---

## 🐛 Troubleshooting

### Issue: Can't access website

```bash
# Check if services are running
docker compose ps

# Check nginx logs
docker compose logs proxy

# Check if port 80 is blocked
sudo netstat -tlnp | grep :80
```

### Issue: Upload fails

```bash
# Check storage permissions
docker compose exec app ls -la storage/

# Check MinIO
docker compose logs minio

# Test MinIO connection
docker compose exec app php artisan tinker
Storage::disk('s3')->put('test.txt', 'Hello');
```

### Issue: Audio not playing

```bash
# Check if FFmpeg processed the file
docker compose logs queue

# Check track in database
docker compose exec app php artisan tinker
App\Models\Track::latest()->first();

# Verify audio file exists in MinIO
docker compose exec minio mc ls local/sc-bucket/audio/
```

### Issue: phpMyAdmin won't load

```bash
# Restart phpMyAdmin
docker compose restart phpmyadmin

# Check logs
docker compose logs phpmyadmin

# Verify database is running
docker compose ps db
```

### Issue: Frontend not loading

```bash
# Check frontend logs
docker compose logs frontend

# Restart frontend
docker compose restart frontend

# Check if node modules installed
docker compose exec frontend ls -la node_modules/
```

---

## 📊 Performance Optimization

### Once You Have Users

```bash
# 1. Enable Redis caching
# Already configured in .env!

# 2. Optimize database
docker compose exec app php artisan optimize
docker compose exec db mysql -u sc_user -psc_pass -e "OPTIMIZE TABLE sc_app.tracks;"

# 3. Run multiple queue workers
# Edit docker-compose.yml:
# Change: docker compose up -d --scale queue=3

# 4. Set up CDN (Cloudflare)
# Point DNS to Cloudflare
# Enable caching rules

# 5. Compress images
# Install imagick in Laravel container
```

---

## 💰 Cost Breakdown

### Contabo VPS
- **Basic Plan:** €7/month (4GB RAM, 2 CPU, 200GB SSD)
- **Recommended:** €12/month (8GB RAM, 4 CPU, 400GB SSD)

### Additional Services (Optional)
- **Domain:** €10/year (Namecheap, Cloudflare)
- **Email:** Free (SendGrid free tier: 100 emails/day)
- **Backup Storage:** €5/month (Backblaze B2: 10GB)
- **CDN:** Free (Cloudflare free tier)
- **SSL:** Free (Let's Encrypt)

**Total First Year:** ~€100-200

---

## 📈 Scaling Path

### Phase 1: Single Server (0-1000 users)
- **Current Setup:** Works perfectly ✅
- **Cost:** €7-12/month
- **What to monitor:** Server resources

### Phase 2: Optimized Single Server (1K-10K users)
- **Upgrade:** Bigger Contabo VPS (€20/month)
- **Add:** CDN (Cloudflare)
- **Add:** Database optimization
- **Cost:** €25/month

### Phase 3: Distributed (10K-100K users)
- **Separate:** Database server
- **Add:** Load balancer
- **Move:** File storage to AWS S3
- **Add:** Redis cluster
- **Cost:** €100-300/month

### Phase 4: Cloud (100K+ users)
- **Move:** AWS/DigitalOcean
- **Add:** Auto-scaling
- **Add:** CDN for audio files
- **Add:** Monitoring (Datadog)
- **Cost:** €500-2000/month

**Start with Phase 1, scale when needed!**

---

## 🎓 Learning Path for Interns

### Month 1: Basics
- Week 1: Setup environment + Git
- Week 2: Laravel routing + React components
- Week 3: Database + API integration
- Week 4: First feature implementation

### Month 2: Features
- Week 5: Comments system
- Week 6: Playlists
- Week 7: Search functionality
- Week 8: Admin dashboard

### Month 3: Polish
- Week 9: Bug fixes + Testing
- Week 10: Performance optimization
- Week 11: Mobile responsiveness
- Week 12: Documentation

---

## 🎯 Success Checklist

### Technical
- [ ] All services running
- [ ] Can register/login
- [ ] Can upload audio
- [ ] Audio plays in browser
- [ ] Admin can approve/reject
- [ ] Search works
- [ ] Mobile responsive
- [ ] HTTPS enabled

### Content
- [ ] 50+ tracks uploaded
- [ ] 10+ categories populated
- [ ] 100+ test users
- [ ] Featured content selected

### Team
- [ ] Interns onboarded
- [ ] Tasks assigned
- [ ] Communication channels set up
- [ ] Code review process established

### Business
- [ ] Terms of Service written
- [ ] Privacy Policy added
- [ ] Content guidelines defined
- [ ] Moderation process documented

---

## 📞 Support

### For Technical Issues
- Check DEPLOYMENT.md
- Check TROUBLESHOOTING section above
- Read Laravel docs: https://laravel.com/docs
- Read React docs: https://react.dev

### For Project Management
- Review PROJECT_PLAN.md
- Review INTERN_GUIDE.md
- Set up weekly meetings
- Use Trello/Jira for tracking

---

## 🎉 You're Ready!

Your Islamic SoundCloud platform is now live! 

**What's next?**
1. ✅ Complete the setup
2. ✅ Test everything thoroughly
3. ✅ Onboard your team
4. ✅ Start developing features
5. ✅ Launch to beta users
6. ✅ Gather feedback
7. ✅ Iterate and improve

**Remember:** Start small, launch fast, improve continuously.

---

## 🤝 Community

Building an Islamic platform? Join us!

- **Email:** project@islamicsoundcloud.com
- **Discord:** [Community link]
- **GitHub:** [Repository link]

---

**May Allah bless this project and make it beneficial for the Ummah! 🕌**

*"The best of people are those who bring most benefit to others."* - Prophet Muhammad ﷺ

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Production Ready ✅

