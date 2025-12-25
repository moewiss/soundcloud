# 🕌 Islamic SoundCloud - Complete Development Plan

## 📋 Project Overview

**Project Name:** Islamic SoundCloud (working name)  
**Purpose:** A platform for Islamic audio content (Quran recitations, lectures, nasheeds, podcasts)  
**Target Users:** Muslims worldwide seeking quality Islamic audio content  
**Moderation:** All content must be reviewed and approved by admin before going public

---

## 🎯 Project Goals

### Phase 1 - MVP (Minimum Viable Product) - 6 weeks
- ✅ User registration and authentication
- ✅ Upload audio (Quran, lectures, nasheeds)
- ✅ Admin approval system
- ✅ Audio streaming and playback
- ✅ User profiles
- ✅ Basic search and categories
- ✅ Like and play count

### Phase 2 - Enhancement - 4 weeks
- ✅ Comments system
- ✅ Playlists
- ✅ Follow system
- ✅ Advanced search with filters
- ✅ Categories (Quran, Hadith, Lectures, Nasheeds, etc.)
- ✅ Arabic language support

### Phase 3 - Mobile - 6 weeks
- ✅ React Native iOS app
- ✅ React Native Android app
- ✅ Offline download feature
- ✅ Push notifications

### Phase 4 - Advanced Features - 8 weeks
- ✅ Live streaming
- ✅ Prayer times integration
- ✅ Quranic text with audio sync
- ✅ Multiple language support
- ✅ Analytics dashboard

---

## 🛠 Technology Stack

### Frontend (Website)
```
Framework: React 18
State Management: Redux Toolkit / Zustand
UI Library: Material-UI (MUI) or Tailwind CSS
Audio Player: Howler.js or React-Player
HTTP Client: Axios
Routing: React Router v6
Build Tool: Vite
```

### Backend (API)
```
Language: PHP 8.3
Framework: Laravel 11
Authentication: Laravel Sanctum (API tokens)
Queue: Redis + Laravel Queue
Database: MySQL 8.0
Storage: MinIO (S3-compatible)
Audio Processing: FFmpeg
```

### Mobile (Future - Phase 3)
```
Framework: React Native
State Management: Redux Toolkit
Audio: react-native-track-player
Storage: AsyncStorage / MMKV
```

### Infrastructure
```
Containerization: Docker + Docker Compose
Web Server: Nginx
Database Admin: phpMyAdmin
Cache/Queue: Redis
Object Storage: MinIO
SSL: Let's Encrypt (Certbot)
```

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                 │
│              (Web Browser / Mobile App)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                     │
│                   SSL Termination (HTTPS)                    │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             ↓                           ↓
┌────────────────────────┐   ┌──────────────────────────────┐
│   React Frontend       │   │   Laravel Backend API        │
│   (Static Files)       │   │   (REST API)                 │
│   - Audio Player       │   │   - Authentication           │
│   - User Interface     │   │   - File Upload              │
│   - Admin Dashboard    │   │   - Content Moderation       │
└────────────────────────┘   └──────────┬───────────────────┘
                                        │
                     ┌──────────────────┼──────────────────┐
                     │                  │                  │
                     ↓                  ↓                  ↓
            ┌────────────────┐  ┌─────────────┐  ┌──────────────┐
            │  MySQL         │  │   Redis     │  │   MinIO      │
            │  (Database)    │  │ (Cache/Queue)│ │ (S3 Storage) │
            │  - Users       │  │             │  │  - Audio     │
            │  - Tracks      │  │             │  │  - Images    │
            │  - Comments    │  └─────────────┘  └──────────────┘
            │  - Playlists   │
            └────────────────┘
                     │
                     ↓
            ┌────────────────┐
            │  phpMyAdmin    │
            │  (DB Admin)    │
            └────────────────┘
```

---

## 🗄️ Database Schema (Detailed)

### Users Table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,
    is_verified_scholar BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Profiles Table
```sql
CREATE TABLE profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    display_name VARCHAR(120),
    bio TEXT,
    avatar_path VARCHAR(255),
    cover_path VARCHAR(255),
    country VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    total_uploads INT DEFAULT 0,
    total_followers INT DEFAULT 0,
    total_plays INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Categories Table
```sql
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id BIGINT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial categories
INSERT INTO categories (name, name_ar, slug, icon) VALUES
('Quran Recitation', 'تلاوة القرآن', 'quran', '📖'),
('Tafsir', 'تفسير', 'tafsir', '📚'),
('Hadith', 'حديث', 'hadith', '📜'),
('Islamic Lectures', 'محاضرات إسلامية', 'lectures', '🎤'),
('Nasheeds', 'أناشيد', 'nasheeds', '🎵'),
('Dua & Dhikr', 'دعاء وذكر', 'dua', '🤲'),
('Fiqh', 'فقه', 'fiqh', '⚖️'),
('Islamic History', 'التاريخ الإسلامي', 'history', '🏛️'),
('Friday Khutbah', 'خطبة الجمعة', 'khutbah', '🕌'),
('Podcasts', 'بودكاست', 'podcasts', '🎙️');
```

### Tracks Table
```sql
CREATE TABLE tracks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    
    -- Audio files
    source_path VARCHAR(255) NOT NULL COMMENT 'Original uploaded file',
    audio_path VARCHAR(255) COMMENT 'Transcoded MP3',
    cover_path VARCHAR(255),
    
    -- Audio metadata
    duration_seconds INT,
    bitrate INT,
    waveform JSON COMMENT 'Waveform data for visualization',
    
    -- Content info
    speaker_name VARCHAR(150),
    language VARCHAR(50) DEFAULT 'ar',
    
    -- Quran-specific fields
    is_quran BOOLEAN DEFAULT FALSE,
    quran_surah_number INT,
    quran_ayah_from INT,
    quran_ayah_to INT,
    reciter_name VARCHAR(150),
    
    -- Moderation
    status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    rejection_reason TEXT,
    moderated_by BIGINT NULL,
    moderated_at TIMESTAMP NULL,
    
    -- Stats
    plays INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    downloads_count INT DEFAULT 0,
    
    -- SEO
    tags JSON,
    slug VARCHAR(255) UNIQUE,
    
    -- Settings
    is_downloadable BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_plays (plays),
    INDEX idx_slug (slug),
    INDEX idx_quran (is_quran, quran_surah_number),
    FULLTEXT idx_search (title, description, speaker_name, reciter_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Likes Table
```sql
CREATE TABLE likes (
    user_id BIGINT NOT NULL,
    track_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    INDEX idx_track (track_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Comments Table
```sql
CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    track_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT NULL COMMENT 'For replies',
    content TEXT NOT NULL,
    status ENUM('visible', 'hidden', 'pending') DEFAULT 'visible',
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    
    INDEX idx_track (track_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Playlists Table
```sql
CREATE TABLE playlists (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_path VARCHAR(255),
    is_public BOOLEAN DEFAULT TRUE,
    tracks_count INT DEFAULT 0,
    total_duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Playlist Tracks Table
```sql
CREATE TABLE playlist_tracks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    playlist_id BIGINT NOT NULL,
    track_id BIGINT NOT NULL,
    position INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_playlist_track (playlist_id, track_id),
    INDEX idx_playlist (playlist_id),
    INDEX idx_position (playlist_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Follows Table
```sql
CREATE TABLE follows (
    follower_id BIGINT NOT NULL,
    following_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_following (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Reports Table (Content Moderation)
```sql
CREATE TABLE reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reporter_id BIGINT NOT NULL,
    track_id BIGINT NULL,
    comment_id BIGINT NULL,
    user_id BIGINT NULL COMMENT 'Reported user',
    reason ENUM('inappropriate', 'copyright', 'spam', 'non_islamic', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by BIGINT NULL,
    reviewed_at TIMESTAMP NULL,
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_track (track_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Activity Log Table
```sql
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    track_id BIGINT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'play, upload, like, comment, etc',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_track (track_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔌 API Endpoints (Complete List)

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login
POST   /api/auth/logout            - Logout
POST   /api/auth/refresh           - Refresh token
POST   /api/auth/forgot-password   - Send reset link
POST   /api/auth/reset-password    - Reset password
GET    /api/auth/me                - Get current user
```

### Users & Profiles
```
GET    /api/users/{id}             - Get user profile (public)
PUT    /api/profile                - Update own profile
POST   /api/profile/avatar         - Upload avatar
POST   /api/profile/cover          - Upload cover image
GET    /api/users/{id}/tracks      - Get user's tracks
GET    /api/users/{id}/playlists   - Get user's playlists
GET    /api/users/{id}/followers   - Get followers list
GET    /api/users/{id}/following   - Get following list
```

### Tracks
```
GET    /api/tracks                 - List approved tracks (with filters)
GET    /api/tracks/{id}            - Get track details
POST   /api/tracks                 - Upload new track
PUT    /api/tracks/{id}            - Update track
DELETE /api/tracks/{id}            - Delete track
GET    /api/tracks/{id}/stream     - Stream audio (increments play count)
POST   /api/tracks/{id}/download   - Download track
GET    /api/me/tracks              - Get my uploaded tracks
GET    /api/tracks/featured        - Get featured tracks
GET    /api/tracks/trending        - Get trending tracks
GET    /api/tracks/recent          - Get recently uploaded
```

### Categories
```
GET    /api/categories             - List all categories
GET    /api/categories/{slug}      - Get category details
GET    /api/categories/{slug}/tracks - Get tracks in category
```

### Likes
```
POST   /api/tracks/{id}/like       - Like a track
DELETE /api/tracks/{id}/like       - Unlike a track
GET    /api/me/likes               - Get my liked tracks
```

### Comments
```
GET    /api/tracks/{id}/comments   - Get track comments
POST   /api/tracks/{id}/comments   - Post comment
PUT    /api/comments/{id}          - Edit comment
DELETE /api/comments/{id}          - Delete comment
POST   /api/comments/{id}/reply    - Reply to comment
```

### Playlists
```
GET    /api/playlists              - List public playlists
GET    /api/playlists/{id}         - Get playlist details
POST   /api/playlists              - Create playlist
PUT    /api/playlists/{id}         - Update playlist
DELETE /api/playlists/{id}         - Delete playlist
POST   /api/playlists/{id}/tracks  - Add track to playlist
DELETE /api/playlists/{id}/tracks/{trackId} - Remove track
PUT    /api/playlists/{id}/reorder - Reorder tracks
GET    /api/me/playlists           - Get my playlists
```

### Follow System
```
POST   /api/users/{id}/follow      - Follow user
DELETE /api/users/{id}/follow      - Unfollow user
GET    /api/me/following           - Users I follow
GET    /api/me/followers           - My followers
GET    /api/me/feed                - Feed from followed users
```

### Search
```
GET    /api/search?q={query}       - Global search
GET    /api/search/tracks?q={query} - Search tracks
GET    /api/search/users?q={query}  - Search users
GET    /api/search/quran?surah={n}  - Search Quran recitations
```

### Reports
```
POST   /api/reports                - Submit report
GET    /api/me/reports             - My submitted reports
```

### Admin Panel
```
GET    /api/admin/tracks/pending   - Get pending tracks
PATCH  /api/admin/tracks/{id}/approve - Approve track
PATCH  /api/admin/tracks/{id}/reject  - Reject track
GET    /api/admin/reports          - Get all reports
PATCH  /api/admin/reports/{id}/resolve - Resolve report
GET    /api/admin/users            - List all users
PATCH  /api/admin/users/{id}/suspend   - Suspend user
PATCH  /api/admin/users/{id}/verify    - Verify user
GET    /api/admin/stats            - Get platform statistics
```

---

## 📱 Frontend Structure (React)

```
soundcloud-frontend/
├── public/
│   ├── index.html
│   └── assets/
│       ├── logo.svg
│       └── images/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Dropdown.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MobileNav.jsx
│   │   ├── audio/
│   │   │   ├── AudioPlayer.jsx          (Main player)
│   │   │   ├── Waveform.jsx             (Visualizer)
│   │   │   ├── PlayerControls.jsx
│   │   │   ├── VolumeControl.jsx
│   │   │   └── PlaylistQueue.jsx
│   │   ├── tracks/
│   │   │   ├── TrackCard.jsx
│   │   │   ├── TrackList.jsx
│   │   │   ├── TrackDetail.jsx
│   │   │   ├── TrackUploadForm.jsx
│   │   │   └── TrackEditForm.jsx
│   │   ├── user/
│   │   │   ├── UserProfile.jsx
│   │   │   ├── UserAvatar.jsx
│   │   │   ├── UserStats.jsx
│   │   │   └── ProfileEditForm.jsx
│   │   ├── comments/
│   │   │   ├── CommentList.jsx
│   │   │   ├── CommentItem.jsx
│   │   │   └── CommentForm.jsx
│   │   ├── playlists/
│   │   │   ├── PlaylistCard.jsx
│   │   │   ├── PlaylistDetail.jsx
│   │   │   └── CreatePlaylistModal.jsx
│   │   └── admin/
│   │       ├── PendingTracks.jsx
│   │       ├── ReportsTable.jsx
│   │       ├── UserManagement.jsx
│   │       └── Statistics.jsx
│   ├── pages/
│   │   ├── Home.jsx                     (Landing page)
│   │   ├── Explore.jsx                  (Browse all tracks)
│   │   ├── Category.jsx                 (Category page)
│   │   ├── TrackPage.jsx                (Single track)
│   │   ├── Upload.jsx                   (Upload page)
│   │   ├── Profile.jsx                  (User profile)
│   │   ├── Playlist.jsx                 (Playlist view)
│   │   ├── Search.jsx                   (Search results)
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Settings.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── Moderation.jsx
│   │       └── Reports.jsx
│   ├── store/                           (Redux Store)
│   │   ├── index.js
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── playerSlice.js
│   │   │   ├── tracksSlice.js
│   │   │   ├── userSlice.js
│   │   │   └── uiSlice.js
│   │   └── api/
│   │       └── apiSlice.js              (RTK Query)
│   ├── services/
│   │   ├── api.js                       (Axios config)
│   │   ├── authService.js
│   │   ├── trackService.js
│   │   ├── userService.js
│   │   └── uploadService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePlayer.js
│   │   ├── useUpload.js
│   │   └── useDebounce.js
│   ├── utils/
│   │   ├── formatters.js                (Time, file size, etc)
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── theme.js                     (MUI theme)
│   │   └── variables.css
│   ├── App.jsx
│   ├── routes.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔨 Backend Structure (Laravel)

```
soundcloud-backend/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       └── CleanupOldFiles.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── Auth/
│   │   │       │   ├── LoginController.php
│   │   │       │   ├── RegisterController.php
│   │   │       │   └── PasswordController.php
│   │   │       ├── TrackController.php
│   │   │       ├── CategoryController.php
│   │   │       ├── ProfileController.php
│   │   │       ├── LikeController.php
│   │   │       ├── CommentController.php
│   │   │       ├── PlaylistController.php
│   │   │       ├── FollowController.php
│   │   │       ├── SearchController.php
│   │   │       ├── ReportController.php
│   │   │       └── Admin/
│   │   │           ├── TrackModerationController.php
│   │   │           ├── ReportController.php
│   │   │           ├── UserManagementController.php
│   │   │           └── StatisticsController.php
│   │   ├── Middleware/
│   │   │   ├── IsAdmin.php
│   │   │   ├── IsModerator.php
│   │   │   └── TrackOwner.php
│   │   ├── Requests/
│   │   │   ├── TrackUploadRequest.php
│   │   │   ├── TrackUpdateRequest.php
│   │   │   ├── CommentRequest.php
│   │   │   └── PlaylistRequest.php
│   │   └── Resources/
│   │       ├── TrackResource.php
│   │       ├── TrackCollection.php
│   │       ├── UserResource.php
│   │       ├── CommentResource.php
│   │       └── PlaylistResource.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Profile.php
│   │   ├── Track.php
│   │   ├── Category.php
│   │   ├── Comment.php
│   │   ├── Playlist.php
│   │   ├── Like.php
│   │   ├── Follow.php
│   │   ├── Report.php
│   │   └── ActivityLog.php
│   ├── Jobs/
│   │   ├── TranscodeAudio.php
│   │   ├── GenerateWaveform.php
│   │   ├── SendNotification.php
│   │   └── CleanupTempFiles.php
│   ├── Services/
│   │   ├── AudioService.php            (FFmpeg wrapper)
│   │   ├── StorageService.php          (S3/MinIO)
│   │   ├── NotificationService.php
│   │   └── SearchService.php
│   └── Policies/
│       ├── TrackPolicy.php
│       ├── CommentPolicy.php
│       └── PlaylistPolicy.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── CategorySeeder.php
│   │   └── AdminSeeder.php
│   └── factories/
├── routes/
│   ├── api.php
│   └── web.php
├── tests/
│   ├── Feature/
│   │   ├── AuthTest.php
│   │   ├── TrackTest.php
│   │   ├── CommentTest.php
│   │   └── AdminTest.php
│   └── Unit/
├── storage/
├── .env.example
├── composer.json
└── README.md
```

---

## 👥 Team Structure & Responsibilities

### Project Manager (You)
- Overall vision and direction
- Review progress weekly
- Approve major features
- Content moderation policy
- Marketing and growth

### Backend Developer (1-2 Interns)
**Skills needed:** PHP, Laravel, MySQL, REST APIs
**Responsibilities:**
- Set up Laravel backend
- Create all API endpoints
- Database design and migrations
- File upload and storage
- FFmpeg audio processing
- Admin panel APIs
- Testing APIs with Postman

**Tasks:**
1. Week 1-2: Setup + Auth + Database
2. Week 3-4: Track upload + Processing
3. Week 5-6: Social features (likes, comments)
4. Week 7-8: Admin panel + Testing

### Frontend Developer (2-3 Interns)
**Skills needed:** React, JavaScript, HTML/CSS, REST APIs
**Responsibilities:**
- Build React website
- Responsive design (mobile-first)
- Audio player integration
- User interface components
- Admin dashboard UI
- API integration
- RTL support for Arabic

**Tasks:**
1. Week 1-2: Setup + Layout + Auth pages
2. Week 3-4: Track pages + Player
3. Week 5-6: User profiles + Social features
4. Week 7-8: Admin panel + Polish

### UI/UX Designer (1 Intern - Optional)
**Skills needed:** Figma, Design principles
**Responsibilities:**
- Design mockups in Figma
- Create logo and branding
- Design Islamic-themed UI
- Color scheme and typography
- Icon set
- Mobile layouts

### DevOps/Deployment (1 Intern or You)
**Skills needed:** Linux, Docker, Nginx
**Responsibilities:**
- Server setup and maintenance
- Docker deployment
- SSL certificates
- Backups
- Monitoring
- Performance optimization

---

## 📅 Development Timeline (Phase 1 - MVP)

### **Week 1-2: Foundation**

#### Backend Team
- [ ] Set up Docker environment
- [ ] Install Laravel + dependencies
- [ ] Create database schema
- [ ] Run migrations
- [ ] Set up MinIO storage
- [ ] Implement authentication (register/login)
- [ ] Create User & Profile models
- [ ] Test auth APIs with Postman

#### Frontend Team
- [ ] Set up React project with Vite
- [ ] Install dependencies (MUI, Axios, Redux)
- [ ] Create project structure
- [ ] Design color scheme and theme
- [ ] Build layout components (Header, Footer, Sidebar)
- [ ] Create Login/Register pages
- [ ] Integrate auth APIs
- [ ] Set up Redux store

**Deliverable:** Working authentication system (both frontend & backend)

---

### **Week 3-4: Core Features**

#### Backend Team
- [ ] Create Track model and migrations
- [ ] Implement file upload endpoint
- [ ] Set up FFmpeg transcoding job
- [ ] Create waveform generation
- [ ] Implement track listing API
- [ ] Create category system
- [ ] Track details API
- [ ] Implement play count increment

#### Frontend Team
- [ ] Build Home page with track listing
- [ ] Create TrackCard component
- [ ] Build track upload form
- [ ] Implement file upload with progress
- [ ] Create audio player component
- [ ] Add waveform visualization
- [ ] Build track detail page
- [ ] Create category pages

**Deliverable:** Users can upload and listen to tracks

---

### **Week 5-6: Social Features & Moderation**

#### Backend Team
- [ ] Implement like system
- [ ] Create comment system
- [ ] Build admin moderation APIs
- [ ] Create admin dashboard endpoints
- [ ] Implement track approval/rejection
- [ ] Add user profile endpoints
- [ ] Create search functionality
- [ ] Add statistics APIs

#### Frontend Team
- [ ] Build user profile pages
- [ ] Implement like functionality
- [ ] Create comment section
- [ ] Build admin dashboard
- [ ] Create pending tracks view
- [ ] Add track approval interface
- [ ] Implement search page
- [ ] Add user stats display

**Deliverable:** Complete social features + admin moderation

---

### **Week 7-8: Polish & Testing**

#### Backend Team
- [ ] Write API tests
- [ ] Optimize database queries
- [ ] Add caching with Redis
- [ ] Implement rate limiting
- [ ] Security audit
- [ ] API documentation
- [ ] Performance testing
- [ ] Bug fixes

#### Frontend Team
- [ ] Responsive design testing
- [ ] Cross-browser testing
- [ ] Loading states and errors
- [ ] Form validations
- [ ] Arabic language support
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] Bug fixes

**Deliverable:** Production-ready MVP

---

## 🎨 Design Guidelines

### Islamic Theme
```
Primary Color: #2E7D32 (Islamic Green)
Secondary Color: #FFA726 (Gold)
Background: #FAFAFA (Light Gray)
Text: #212121 (Dark Gray)
Accent: #00897B (Teal)

Font (Arabic): Noto Naskh Arabic / Amiri
Font (English): Inter / Roboto

Icons: Use respectful, clean iconography
Images: No inappropriate content
```

### UI Components Style
- Clean, minimal design
- Card-based layouts
- Smooth animations
- Large, touchable buttons
- Clear typography hierarchy
- Ample whitespace

---

## 🧪 Testing Checklist

### Backend Testing
```
✓ Authentication works (register, login, logout)
✓ File upload succeeds
✓ Audio transcoding works
✓ Track approval/rejection works
✓ Like/unlike functionality
✓ Comments post and display
✓ Search returns results
✓ Admin can access admin endpoints
✓ Regular users cannot access admin endpoints
✓ File permissions correct
✓ Database queries optimized
```

### Frontend Testing
```
✓ Login/Register forms work
✓ File upload shows progress
✓ Audio player plays tracks
✓ Waveform displays correctly
✓ Like button toggles
✓ Comments submit and display
✓ Search works
✓ Responsive on mobile
✓ Works on Chrome, Firefox, Safari
✓ Arabic text displays correctly (RTL)
✓ Loading states show
✓ Error messages display
```

---

## 🚀 Deployment Steps

### On Contabo Server

1. **Clean Server**
```bash
# Remove old containers
docker container prune -a -f
docker volume prune -f
docker image prune -a -f

# Remove old files
rm -rf /var/www/*
```

2. **Upload Files**
```bash
# Upload project files via SFTP or git
```

3. **Run Setup**
```bash
cd ~/soundcloud
chmod +x setup.sh
./setup.sh
```

4. **Configure Domain**
```bash
# Update .env with your domain
# Setup SSL with Certbot
sudo certbot --nginx -d yourdomain.com
```

5. **Test Everything**
```bash
# Test API
curl https://yourdomain.com/api/categories

# Check logs
docker compose logs -f
```

---

## 📚 Documentation for Interns

### Getting Started Guide
```
1. Clone the repository
2. Read the README
3. Set up local environment
4. Review the database schema
5. Understand the API structure
6. Run the project locally
7. Pick a task from the board
8. Create a feature branch
9. Code and test
10. Submit pull request
```

### Code Standards

#### Backend (PHP/Laravel)
```php
// Follow PSR-12 coding standard
// Use type hints
// Write docblocks
// Use meaningful variable names

/**
 * Approve a pending track
 *
 * @param Track $track
 * @return JsonResponse
 */
public function approve(Track $track): JsonResponse
{
    $this->authorize('approve', $track);
    
    $track->update(['status' => 'approved']);
    
    return response()->json([
        'message' => 'Track approved successfully',
        'track' => new TrackResource($track)
    ]);
}
```

#### Frontend (React)
```javascript
// Use functional components
// Use hooks (useState, useEffect, etc)
// Keep components small and focused
// Use PropTypes or TypeScript
// Follow naming conventions

const TrackCard = ({ track, onPlay, onLike }) => {
  const [isLiked, setIsLiked] = useState(track.is_liked);
  
  const handleLike = async () => {
    try {
      await likeTrack(track.id);
      setIsLiked(!isLiked);
      onLike?.();
    } catch (error) {
      console.error('Failed to like track', error);
    }
  };
  
  return (
    <div className="track-card">
      <img src={track.cover_url} alt={track.title} />
      <h3>{track.title}</h3>
      <button onClick={() => onPlay(track)}>Play</button>
      <button onClick={handleLike}>
        {isLiked ? '❤️' : '🤍'} {track.likes_count}
      </button>
    </div>
  );
};
```

### Git Workflow
```
Branches:
- main (production)
- develop (development)
- feature/feature-name (new features)
- fix/bug-name (bug fixes)

Commit Messages:
- feat: Add user profile page
- fix: Fix audio player bug
- style: Update button colors
- refactor: Optimize database queries
- docs: Update README
```

---

## 📊 Success Metrics

### Phase 1 (MVP - Week 8)
- [ ] 100+ audio tracks uploaded
- [ ] 500+ registered users
- [ ] All core features working
- [ ] Admin approval system functional
- [ ] Mobile responsive

### Phase 2 (Month 3)
- [ ] 1000+ tracks
- [ ] 5000+ users
- [ ] Comments and playlists active
- [ ] Arabic interface live
- [ ] 10+ categories

### Phase 3 (Month 6)
- [ ] Mobile app launched
- [ ] 10,000+ users
- [ ] Partnerships with scholars/reciters
- [ ] Revenue model implemented

---

## 💰 Budget Estimate

### Initial Setup
- Server (Contabo): €7-15/month
- Domain: €10/year
- SSL Certificate: Free (Let's Encrypt)
- **Total Year 1:** ~€110-200

### Optional
- CDN (Cloudflare): Free tier
- Backup storage: €5/month
- Email service (SendGrid): Free tier
- Analytics: Free (self-hosted)

---

## 🔐 Security Considerations

```
✓ HTTPS everywhere
✓ Rate limiting on APIs
✓ File upload validation (type, size)
✓ XSS protection
✓ CSRF tokens
✓ SQL injection protection (Laravel ORM)
✓ Content Security Policy headers
✓ Regular security updates
✓ User password hashing (bcrypt)
✓ API token encryption
✓ Secure file storage (private S3 buckets)
✓ Admin-only routes protected
```

---

## 📱 Phase 3: React Native App (Future)

```
Features:
- Native audio playback
- Offline downloads
- Push notifications
- Background play
- Lock screen controls
- Prayer time integration
- Qibla finder
- Dark mode
```

---

## 📞 Support & Communication

### Daily Standup (15 min)
- What did you do yesterday?
- What will you do today?
- Any blockers?

### Weekly Review (1 hour)
- Demo completed features
- Review code quality
- Plan next week
- Address challenges

### Tools
- GitHub (code repository)
- Trello/Jira (project management)
- Slack/Discord (communication)
- Figma (design)
- Postman (API testing)

---

## 🎯 Next Steps

1. **Hire/Assign Interns**
   - Backend: 1-2 developers
   - Frontend: 2-3 developers
   - Designer: 1 (optional)

2. **Set Up Infrastructure**
   - Provision Contabo server
   - Set up GitHub repository
   - Create project boards
   - Set up communication channels

3. **Kickoff Meeting**
   - Share this document
   - Assign initial tasks
   - Set up development environments
   - Schedule first sprint

4. **Start Development**
   - Week 1 begins!
   - Daily standups
   - Code reviews
   - Track progress

---

**Let's build something amazing for the Muslim Ummah! 🕌**

For questions or clarifications, contact the project manager.

