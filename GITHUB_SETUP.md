# 🚀 GitHub Auto-Deployment Setup Guide

This guide will help you set up automatic deployment from GitHub to your server. Every time you push code to GitHub, it will automatically deploy to your server!

## 📋 Overview

**What you'll get:**
- Push code to GitHub → Automatically deploys to server
- No manual SSH needed
- Just: `git commit && git push` → refresh browser! ✨

---

## 🎯 Step 1: Setup Git Locally

### 1.1 Initialize Git Repository (if not already done)

Open PowerShell in your project directory:

```powershell
# Navigate to your project
cd D:\work\Soundcloud

# Initialize git (if not already a repo)
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - SoundCloud Clone"
```

### 1.2 Verify .gitignore

Make sure `.gitignore` file exists and excludes sensitive files. It should already be created!

---

## 🌐 Step 2: Create GitHub Repository

### 2.1 Create New Repository on GitHub

1. Go to [GitHub](https://github.com/)
2. Click the **"+"** button (top right)
3. Select **"New repository"**
4. Name it: `soundcloud-clone` (or any name you prefer)
5. **Keep it Private** (recommended for personal projects)
6. **Do NOT** initialize with README (we already have code)
7. Click **"Create repository"**

### 2.2 Link Local Repo to GitHub

GitHub will show you commands. Use these:

```powershell
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/soundcloud-clone.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Enter your GitHub credentials when prompted.**

---

## 🔐 Step 3: Configure GitHub Secrets

GitHub Actions needs your server credentials to deploy automatically.

### 3.1 Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. In left sidebar, click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"**
5. Add these three secrets:

#### Secret 1: SERVER_HOST
```
Name: SERVER_HOST
Value: 185.250.36.33
```

#### Secret 2: SERVER_USER
```
Name: SERVER_USER
Value: root
```

#### Secret 3: SERVER_PASSWORD
```
Name: SERVER_PASSWORD
Value: GNCWrcDCPkOZJpNQip9l
```

**Important:** Never commit these credentials to your code! They're only stored in GitHub Secrets.

---

## 🖥️ Step 4: Setup Server for Auto-Deployment

Now we need to prepare your server to receive automatic deployments.

### 4.1 SSH into Your Server

```powershell
ssh root@185.250.36.33
# Enter password: GNCWrcDCPkOZJpNQip9l
```

### 4.2 Install Git on Server (if not installed)

```bash
apt update
apt install -y git
```

### 4.3 Clone Repository to Server

```bash
# Navigate to project directory
cd /root

# Remove existing directory if it exists (backup first if needed!)
# CAREFUL: This will delete existing files
mv islamic-soundcloud islamic-soundcloud.backup 2>/dev/null || true

# Clone your GitHub repository (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/soundcloud-clone.git islamic-soundcloud

# Navigate to project
cd islamic-soundcloud
```

### 4.4 Configure Git for Server

```bash
# Set git to remember credentials (so auto-deploy can pull)
cd /root/islamic-soundcloud

# For public repositories, no auth needed
# For private repositories, use Personal Access Token (see section below)

# Set git to not ask for credentials
git config --global credential.helper store
```

### 4.5 Make Auto-Deploy Script Executable

```bash
chmod +x auto-deploy.sh
```

### 4.6 Test Auto-Deploy Script

```bash
# Run it manually to test
./auto-deploy.sh
```

If it works, you'll see colorful output showing the deployment process!

---

## 🔑 Step 5: GitHub Personal Access Token (For Private Repos)

If your repository is **private**, you need a Personal Access Token for the server to pull code.

### 5.1 Create Personal Access Token

1. Go to GitHub → **Settings** (your profile, not repo)
2. Scroll down to **"Developer settings"** (bottom left)
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**
5. Name it: `Server Deployment Token`
6. Set expiration: **No expiration** (or custom)
7. Select scopes:
   - ✅ **repo** (all sub-options)
8. Click **"Generate token"**
9. **Copy the token** (you won't see it again!)

### 5.2 Configure Token on Server

SSH into your server and run:

```bash
cd /root/islamic-soundcloud

# Set remote URL with token (replace YOUR_TOKEN and YOUR_USERNAME)
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/soundcloud-clone.git

# Test it
git pull
```

---

## ✅ Step 6: Verify Everything Works

### 6.1 Make a Test Change

On your local machine (Windows):

```powershell
cd D:\work\Soundcloud

# Make a small change (e.g., edit README.md)
echo "# Test change" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deployment"
git push
```

### 6.2 Watch GitHub Actions

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. You should see your workflow running!
4. Click on it to see live logs

### 6.3 Verify on Server

After GitHub Actions completes (about 1-2 minutes):

```bash
# SSH into server
ssh root@185.250.36.33

# Check deployment log
tail -20 /root/islamic-soundcloud/deploy.log

# Verify services
cd /root/islamic-soundcloud
docker compose ps
```

### 6.4 Test the Website

Open browser:
- Frontend: http://185.250.36.33:5173
- Backend: http://185.250.36.33/api

**Changes should be live!** 🎉

---

## 🔄 Daily Workflow

From now on, whenever you want to deploy changes:

```powershell
# 1. Make your changes in D:\work\Soundcloud

# 2. Commit and push
git add .
git commit -m "Description of changes"
git push

# 3. Wait 1-2 minutes for GitHub Actions to deploy

# 4. Refresh browser - changes are live! ✨
```

**That's it!** No manual SSH, no manual deployment scripts.

---

## 🛠️ Troubleshooting

### Issue: GitHub Actions fails with "Permission denied"

**Solution:** Check that your SERVER_PASSWORD secret is correct.

1. Go to GitHub repo → Settings → Secrets
2. Update SERVER_PASSWORD secret
3. Re-run the workflow

### Issue: Git push asks for credentials

**Solution:** Use Personal Access Token instead of password

```powershell
# When git asks for password, use your Personal Access Token instead
```

Or use SSH keys (advanced):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add public key to GitHub: Settings → SSH Keys
```

### Issue: Changes not appearing after deployment

**Solution:** 
1. Check GitHub Actions completed successfully
2. SSH into server and check logs:
   ```bash
   docker compose logs -f app
   docker compose logs -f frontend
   ```
3. Hard refresh browser: `Ctrl + Shift + R`

### Issue: Docker containers not running

**Solution:**
```bash
ssh root@185.250.36.33
cd /root/islamic-soundcloud
docker compose ps
docker compose up -d
```

---

## 📊 Monitoring Deployments

### View Deployment History

GitHub: Repository → **Actions** tab

### View Server Logs

```bash
# SSH into server
ssh root@185.250.36.33

# View deployment log
tail -50 /root/islamic-soundcloud/deploy.log

# View Docker logs
cd /root/islamic-soundcloud
docker compose logs -f
```

### Manual Deployment (if needed)

```bash
# SSH into server
ssh root@185.250.36.33

# Run deployment script
cd /root/islamic-soundcloud
./auto-deploy.sh
```

---

## 🔒 Security Best Practices

### 1. Use SSH Keys Instead of Passwords

More secure than password authentication:

```bash
# On your local machine
ssh-keygen -t ed25519

# Copy to server
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@185.250.36.33 "cat >> ~/.ssh/authorized_keys"

# Update GitHub Secrets to use key instead
```

### 2. Limit File Permissions

```bash
# On server
chmod 600 /root/islamic-soundcloud/.env
chmod 700 /root/islamic-soundcloud
```

### 3. Use Deploy Keys

Instead of Personal Access Token, use Deploy Keys:

1. GitHub repo → Settings → Deploy keys
2. Add server's SSH public key
3. Grant write access (for pulling)

### 4. Set Up Firewall

```bash
# On server - only allow necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 5173  # Frontend (or use reverse proxy)
ufw enable
```

---

## 🎯 Advanced: Deployment Notifications

### Get Notified on Discord/Slack

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Notify Discord
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Deployment"
```

---

## 📚 Summary

**Setup Once:**
1. ✅ Create `.gitignore`
2. ✅ Push to GitHub
3. ✅ Add GitHub Secrets
4. ✅ Clone repo on server
5. ✅ Configure auto-deploy

**Daily Usage:**
```bash
git add .
git commit -m "changes"
git push
# → Automatically deploys!
```

---

## 🎉 Success!

You now have a professional CI/CD pipeline! 🚀

**Workflow:**
Local Changes → GitHub → Automatic Deployment → Live Server

**Questions?** Check the troubleshooting section or deployment logs.

---

**Happy Coding! 🕌 Alhamdulillah**

