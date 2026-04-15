#!/bin/bash

echo "====================================="
echo "  Gmail SMTP Email Verification     "
echo "     Deployment Script               "
echo "====================================="
echo ""

# Go to project root
cd ~/islamic-soundcloud

# Step 1: Pull latest code
echo "📦 Step 1: Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code pulled successfully"
echo ""

# Step 2: Configure SMTP in .env
echo "🔧 Step 2: Configuring Gmail SMTP settings..."
docker compose exec -T app bash -c "cat >> .env << 'EOF'

# Gmail SMTP Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tarek.zaghloul@rkiehsolutions.com
MAIL_PASSWORD=fohkkofnhtaczisa
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tarek.zaghloul@rkiehsolutions.com
MAIL_FROM_NAME=\"Islamic Soundcloud\"
EOF
"
echo "✅ SMTP settings configured"
echo ""

# Step 3: Deploy Laravel files
echo "📤 Step 3: Deploying Laravel backend files..."

# Create directories if they don't exist
docker compose exec -T app mkdir -p /var/www/html/app/Mail
docker compose exec -T app mkdir -p /var/www/html/resources/views/emails

# Copy migration
docker cp laravel/database/migrations/2026_01_05_000001_add_email_verification_to_users.php sc_app:/var/www/html/database/migrations/

# Copy Mailable classes
docker cp laravel/app/Mail/VerifyEmailMail.php sc_app:/var/www/html/app/Mail/
docker cp laravel/app/Mail/ResetPasswordMail.php sc_app:/var/www/html/app/Mail/

# Copy email templates
docker cp laravel/resources/views/emails/verify-email.blade.php sc_app:/var/www/html/resources/views/emails/
docker cp laravel/resources/views/emails/reset-password.blade.php sc_app:/var/www/html/resources/views/emails/

# Update AuthController
docker cp laravel/controllers/AuthController.php sc_app:/var/www/html/app/Http/Controllers/Api/

# Update User model
docker cp laravel/models/User.php sc_app:/var/www/html/app/Models/

# Update API routes
docker cp laravel/routes/api.php sc_app:/var/www/html/routes/

echo "✅ Backend files deployed"
echo ""

# Step 4: Run database migration
echo "🗄️  Step 4: Running database migration..."
docker compose exec -T app php artisan migrate --force
echo "✅ Migration completed"
echo ""

# Step 5: Clear Laravel cache
echo "🧹 Step 5: Clearing Laravel caches..."
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan cache:clear
docker compose exec -T app php artisan route:clear
echo "✅ Caches cleared"
echo ""

# Step 6: Build and deploy frontend
echo "🎨 Step 6: Building frontend..."
docker compose exec -T frontend npm run build
echo "✅ Frontend built successfully"
echo ""

# Step 7: Restart services
echo "🔄 Step 7: Restarting services..."
docker compose restart app
docker compose restart frontend
echo "✅ Services restarted"
echo ""

# Step 8: Verify configuration
echo "🔍 Step 8: Verifying configuration..."
echo ""
echo "Checking SMTP configuration:"
docker compose exec -T app grep "MAIL_MAILER" .env
echo ""
echo "Checking if migration ran successfully:"
docker compose exec -T app php artisan migrate:status | grep "add_email_verification_to_users"
echo ""

echo "====================================="
echo "  ✅ Deployment Complete!            "
echo "====================================="
echo ""
echo "📧 Gmail SMTP Email Verification is now active!"
echo ""
echo "Test the following:"
echo "1. Register a new user → Check email for verification link"
echo "2. Click verification link → Should verify and redirect to login"
echo "3. Try logging in before verifying → Should show error"
echo "4. Use 'Forgot Password' → Should receive reset email"
echo "5. Admin panel → Generate link removed, only direct reset available"
echo ""
echo "Check your application at: http://185.250.36.33:5173"
echo ""

