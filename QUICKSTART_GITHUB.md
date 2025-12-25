# 🚀 Quick Start: GitHub Auto-Deployment

Get your project on GitHub with automatic deployment in **10 minutes**!

---

## ⚡ Super Fast Setup

### 1️⃣ Push to GitHub (5 minutes)

```powershell
# In PowerShell, navigate to your project
cd D:\work\Soundcloud

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub.com (click + → New repository)
# Name: soundcloud-clone
# Keep private
# Don't initialize with README

# Link and push (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/soundcloud-clone.git
git branch -M main
git push -u origin main
```

### 2️⃣ Add GitHub Secrets (2 minutes)

Go to: `GitHub Repo → Settings → Secrets and variables → Actions → New repository secret`

Add these 3 secrets:

| Name | Value |
|------|-------|
| `SERVER_HOST` | `185.250.36.33` |
| `SERVER_USER` | `root` |
| `SERVER_PASSWORD` | `GNCWrcDCPkOZJpNQip9l` |

### 3️⃣ Setup Server (3 minutes)

```bash
# SSH into server
ssh root@185.250.36.33
# Password: GNCWrcDCPkOZJpNQip9l

# Install git
apt update && apt install -y git

# Backup old directory (if exists)
cd /root
mv islamic-soundcloud islamic-soundcloud.backup 2>/dev/null || true

# Clone from GitHub (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/soundcloud-clone.git islamic-soundcloud

# Setup
cd islamic-soundcloud
chmod +x auto-deploy.sh

# Deploy current code
docker compose up -d
./auto-deploy.sh
```

---

## ✅ Test It!

### Make a test change:

```powershell
# On your local machine
cd D:\work\Soundcloud

# Edit any file
echo "# Test" >> README.md

# Push
git add .
git commit -m "Test deployment"
git push
```

### Watch it deploy:

1. Go to GitHub → your repo → **Actions** tab
2. See the deployment running! 🚀
3. Wait 1-2 minutes
4. Refresh: http://185.250.36.33:5173

---

## 🎯 Daily Workflow

```powershell
# Make changes locally
# ...edit files...

# Deploy to server
git add .
git commit -m "My changes"
git push

# Wait 1-2 minutes → Refresh browser ✨
```

**That's it!**

---

## 🔧 Common Issues

### Issue: GitHub Actions fails

**Check:** Are the 3 secrets added correctly?
- Go to: Repo → Settings → Secrets and variables → Actions

### Issue: Git asks for password

**Use Personal Access Token:**
1. GitHub → Settings (your profile) → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token → Select "repo" scope
4. Copy token
5. Use as password when pushing

### Issue: Private repo, server can't pull

**On server, use token in git URL:**
```bash
cd /root/islamic-soundcloud
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/soundcloud-clone.git
```

---

## 📖 Full Documentation

- **Complete Guide:** See `GITHUB_SETUP.md`
- **Deployment Details:** See `DEPLOYMENT.md`
- **Project Quickstart:** See `QUICKSTART.md`

---

## 🎉 You're Done!

Your workflow is now:
1. Code locally
2. `git push`
3. Automatically deploys
4. Refresh browser

**Professional CI/CD Pipeline Complete! 🚀**

---

**Need help?** Check `GITHUB_SETUP.md` for detailed troubleshooting.

**Alhamdulillah! 🕌**

