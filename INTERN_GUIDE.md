# 🎓 Intern Onboarding Guide - Islamic SoundCloud

Welcome to the team! This guide will help you get started.

---

## 📚 What You Need to Know

### For Backend Interns (PHP/Laravel)
**Prerequisites:**
- PHP 8+ basics
- MySQL/SQL queries
- REST API concepts
- Laravel framework (we'll teach you!)
- Postman for testing APIs

**Learning Resources:**
- Laravel docs: https://laravel.com/docs
- PHP basics: https://www.php.net/manual/en/
- REST API: https://restfulapi.net/
- Laravel course: https://laracasts.com/series/laravel-8-from-scratch

### For Frontend Interns (React)
**Prerequisites:**
- HTML, CSS, JavaScript (ES6+)
- React basics (components, hooks, state)
- Git basics
- Responsive design

**Learning Resources:**
- React docs: https://react.dev
- JavaScript ES6: https://javascript.info/
- CSS Flexbox/Grid: https://css-tricks.com/
- React course: https://react.dev/learn

---

## 🚀 Day 1: Setup Your Environment

### 1. Install Required Software

#### Windows Users:
```powershell
# Install Git
# Download from: https://git-scm.com/download/win

# Install Node.js (for frontend)
# Download from: https://nodejs.org/

# Install VS Code
# Download from: https://code.visualstudio.com/

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
```

#### Mac Users:
```bash
# Install Homebrew first
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git, Node, Docker
brew install git node
brew install --cask docker
```

#### Linux Users:
```bash
# Install Git, Node, Docker
sudo apt update
sudo apt install -y git nodejs npm docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

### 2. Clone the Repository

```bash
cd ~/Desktop
git clone https://github.com/YOUR_ORG/islamic-soundcloud.git
cd islamic-soundcloud
```

### 3. Setup Backend (Laravel)

```bash
# Start Docker services
docker compose up -d

# Wait for containers to start (check with)
docker compose ps

# Install Laravel dependencies
docker compose exec app composer install

# Copy environment file
docker compose exec app cp .env.example .env

# Generate app key
docker compose exec app php artisan key:generate

# Run migrations
docker compose exec app php artisan migrate

# Create admin user
docker compose exec app php artisan tinker
```

In tinker:
```php
$user = App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@test.com',
    'password' => bcrypt('password'),
    'is_admin' => true
]);

App\Models\Profile::create([
    'user_id' => $user->id,
    'display_name' => 'Admin'
]);
exit
```

### 4. Setup Frontend (React)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Your app should now be running at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost/api
- **phpMyAdmin:** http://localhost:8080
- **MinIO Console:** http://localhost:9001

---

## 📖 Day 2-3: Understanding the Codebase

### Backend Structure Tour

```bash
# Open project in VS Code
code .

# Important files to review:
# 1. routes/api.php - All API endpoints
# 2. app/Models/ - Database models
# 3. app/Http/Controllers/Api/ - API logic
# 4. database/migrations/ - Database structure
# 5. app/Jobs/ - Background tasks
```

**Your first task:** Read through these files and understand the flow:
1. How user registration works (`RegisterController.php`)
2. How tracks are uploaded (`TrackController.php`)
3. How the database is structured (migrations)

### Frontend Structure Tour

```bash
cd frontend

# Important files to review:
# 1. src/App.jsx - Main app component
# 2. src/pages/ - All pages
# 3. src/components/ - Reusable components
# 4. src/services/api.js - API calls
# 5. src/store/ - State management
```

**Your first task:** Review these files:
1. How login works (`pages/Login.jsx`)
2. How the audio player works (`components/audio/AudioPlayer.jsx`)
3. How API calls are made (`services/api.js`)

---

## 🎯 Week 1 Tasks

### Backend Intern Tasks

#### Task 1: Create Category API (Easy)
```
File: app/Http/Controllers/Api/CategoryController.php
Goal: Create an endpoint to list all categories

Steps:
1. Create the controller
2. Add index() method to fetch categories
3. Return JSON response
4. Add route in routes/api.php
5. Test with Postman

Expected Output:
GET /api/categories
{
  "data": [
    {"id": 1, "name": "Quran", "slug": "quran"},
    {"id": 2, "name": "Lectures", "slug": "lectures"}
  ]
}
```

#### Task 2: Add Track Search (Medium)
```
File: app/Http/Controllers/Api/SearchController.php
Goal: Search tracks by title

Steps:
1. Create SearchController
2. Add search() method
3. Use Track::where('title', 'like', "%$query%")
4. Return paginated results
5. Test with Postman

Expected:
GET /api/search?q=quran
{
  "data": [...tracks...],
  "current_page": 1,
  "last_page": 5
}
```

#### Task 3: Track Play Count (Medium)
```
File: app/Http/Controllers/Api/TrackController.php
Goal: Increment play count when track is streamed

Steps:
1. Find stream() method
2. Add: $track->increment('plays');
3. Log the play in activity_logs table
4. Test by playing a track
```

### Frontend Intern Tasks

#### Task 1: Create Category Card Component (Easy)
```
File: src/components/categories/CategoryCard.jsx
Goal: Display a category with icon and track count

Requirements:
- Show category icon
- Show category name (English + Arabic)
- Show number of tracks
- Click to navigate to category page
- Responsive design

Use Material-UI Card component
```

#### Task 2: Build Categories Page (Medium)
```
File: src/pages/Categories.jsx
Goal: Display all categories in a grid

Steps:
1. Fetch categories from API
2. Display in responsive grid (3 columns desktop, 1 mobile)
3. Use CategoryCard component
4. Add loading state
5. Add error handling
```

#### Task 3: Add Search Bar (Medium)
```
File: src/components/layout/Header.jsx
Goal: Add search functionality in header

Requirements:
- Search input with icon
- Debounce input (wait 500ms)
- Call search API
- Navigate to search results page
- Show loading indicator
```

### UI/UX Designer Tasks

#### Task 1: Design Logo
```
Tools: Figma, Illustrator
Goal: Create logo for Islamic SoundCloud

Requirements:
- Islamic theme (use green, gold colors)
- Include microphone or sound wave
- Can incorporate Islamic patterns
- Provide in SVG and PNG formats
- 3 versions: full, icon, text-only
```

#### Task 2: Design Home Page Mockup
```
Tool: Figma
Goal: Create high-fidelity mockup of home page

Sections:
- Header with logo and navigation
- Hero section with featured content
- Categories grid
- Trending tracks
- Recent uploads
- Footer

Provide:
- Desktop (1920px)
- Tablet (768px)
- Mobile (375px)
```

---

## 🔧 Daily Workflow

### Morning (9 AM)
1. **Pull latest code**
   ```bash
   git pull origin develop
   ```

2. **Check your assigned task** on Trello/Jira

3. **Create feature branch**
   ```bash
   git checkout -b feature/your-task-name
   ```

### During Day
4. **Write code**
   - Follow code standards
   - Test your changes
   - Ask questions in Slack if stuck

5. **Commit frequently**
   ```bash
   git add .
   git commit -m "feat: add category listing"
   ```

### End of Day (5 PM)
6. **Push your branch**
   ```bash
   git push origin feature/your-task-name
   ```

7. **Create Pull Request** on GitHub
   - Describe what you did
   - Add screenshots if UI work
   - Assign reviewer

8. **Update Trello** card status

---

## 🐛 Debugging Tips

### Backend Issues

#### "Class not found" Error
```bash
# Regenerate autoload files
docker compose exec app composer dump-autoload
```

#### "Migration failed" Error
```bash
# Reset database
docker compose exec app php artisan migrate:fresh

# Check database connection
docker compose exec app php artisan tinker
DB::connection()->getPdo();
```

#### "Storage not writable" Error
```bash
# Fix permissions
docker compose exec app chmod -R 775 storage bootstrap/cache
docker compose exec app chown -R www-data:www-data storage
```

### Frontend Issues

#### "Module not found" Error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### "API call fails" Error
```javascript
// Check CORS settings in Laravel
// Check .env VITE_API_URL is correct
// Check network tab in browser DevTools
```

#### React Component Not Updating
```javascript
// Make sure you're updating state correctly
// Use console.log() to debug
// Check React DevTools
```

---

## 📝 Code Review Checklist

Before submitting your PR, check:

### Backend
- [ ] Code follows PSR-12 standards
- [ ] All database queries use Eloquent (no raw SQL)
- [ ] Validation added for all inputs
- [ ] Authorization checks in place
- [ ] Tested API with Postman
- [ ] No sensitive data in code
- [ ] Comments for complex logic
- [ ] No console.log or dd() left behind

### Frontend
- [ ] Component is responsive (mobile-first)
- [ ] Loading states added
- [ ] Error handling implemented
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] No console errors in browser
- [ ] Code is readable and commented
- [ ] PropTypes or TypeScript types defined
- [ ] Tested on Chrome and Firefox

---

## 🎓 Learning Resources by Week

### Week 1: Foundations
- **Backend:** Laravel routing and controllers
- **Frontend:** React components and props
- **All:** Git basics and workflow

### Week 2: Database
- **Backend:** Eloquent ORM and relationships
- **Frontend:** API integration with Axios
- **All:** Database design principles

### Week 3: Advanced Features
- **Backend:** Jobs and queues
- **Frontend:** State management (Redux)
- **All:** Testing basics

### Week 4: Polish
- **Backend:** Performance optimization
- **Frontend:** UX improvements
- **All:** Code review best practices

---

## 🆘 Getting Help

### 1. Check Documentation
- Laravel: https://laravel.com/docs
- React: https://react.dev
- Our Wiki: [Internal docs link]

### 2. Ask Your Team
- Slack channel: #dev-help
- Tag: @backend-lead or @frontend-lead

### 3. Debug First
- Use console.log() / dd()
- Check browser DevTools
- Read error messages carefully

### 4. Google It
- StackOverflow usually has answers
- Laravel forums
- React community

### 5. Schedule 1-on-1
- Book time with team lead
- Prepare your questions
- Share your screen

---

## 🎯 Success Tips

1. **Ask Questions** - No question is stupid
2. **Read Error Messages** - They tell you what's wrong
3. **Test Your Code** - Don't just assume it works
4. **Commit Often** - Small commits are better
5. **Write Comments** - Help future you
6. **Take Breaks** - Pomodoro technique (25 min work, 5 min break)
7. **Learn Daily** - Read one article/watch one video per day
8. **Help Others** - Teaching helps you learn
9. **Stay Organized** - Use Trello, take notes
10. **Have Fun!** - You're building something cool!

---

## 📊 Evaluation Criteria

You'll be evaluated on:
- **Code Quality** (40%) - Clean, readable, maintainable
- **Completion** (30%) - Finish assigned tasks on time
- **Communication** (15%) - Ask questions, give updates
- **Teamwork** (10%) - Help others, code reviews
- **Learning** (5%) - Show improvement over time

---

## 🎉 Welcome to the Team!

You're now part of building something meaningful for the Muslim community. Your work will help millions access Islamic knowledge.

**Let's build something amazing together! 🕌**

---

## Quick Reference

### Useful Commands

```bash
# Docker
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose logs -f app    # View app logs
docker compose restart app    # Restart a service

# Laravel
docker compose exec app php artisan migrate     # Run migrations
docker compose exec app php artisan tinker      # Laravel REPL
docker compose exec app php artisan route:list  # List all routes

# Git
git status                    # Check status
git add .                     # Stage all changes
git commit -m "message"       # Commit
git push                      # Push to remote
git pull                      # Pull latest

# Frontend
npm run dev                   # Start dev server
npm run build                 # Build for production
npm run lint                  # Check code quality
```

### Important URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost/api
- phpMyAdmin: http://localhost:8080
- MinIO Console: http://localhost:9001
- API Docs: http://localhost/api/documentation

### Team Contacts

- Project Manager: [Your contact]
- Backend Lead: [Contact]
- Frontend Lead: [Contact]
- Slack: #islamic-soundcloud

---

**Good luck, and welcome aboard! 🚀**

