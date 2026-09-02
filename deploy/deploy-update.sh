#!/usr/bin/env bash
# ==============================================================================
# AAKASH E-COM Platform - Continuous Deployment / Update Script
# ==============================================================================

set -e

APP_DIR="/var/www/aakash-ecom"

echo "🔄 Deploying / Updating AAKASH E-COM Application..."

cd "$APP_DIR"

# 1. Pull latest code (if git repository)
if [ -d ".git" ]; then
    echo "📥 Pulling latest git updates..."
    git pull origin main
fi

# 2. Build Backend
echo "📦 Installing & Building Backend..."
cd "$APP_DIR/backend"
if [ ! -f ".env" ] && [ -f ".env.production" ]; then
    echo "📄 Creating initial .env from .env.production template..."
    cp .env.production .env
else
    echo "🔒 Preserving existing .env file."
fi
npm install
chmod -R +x node_modules/.bin
npx prisma migrate deploy
npx prisma generate
npm run build

# 3. Build Frontend
echo "🎨 Installing & Building Frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build

# 4. Restart Application via PM2
echo "🚀 Restarting PM2 Backend Cluster..."
cd "$APP_DIR"
mkdir -p logs
pm2 reload deploy/ecosystem.config.js --env production || pm2 start deploy/ecosystem.config.js --env production
pm2 save

echo "🎉 Deployment / Update Finished Successfully!"
