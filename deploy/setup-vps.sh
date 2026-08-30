#!/usr/bin/env bash
# ==============================================================================
# AAKASH E-COM Platform - VPS Initial Setup Script for Hostinger Ubuntu LTS
# ==============================================================================

set -e

echo "🚀 Starting Hostinger VPS Server Environment Provisioning..."

# 1. System Updates
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx postgresql postgresql-contrib redis-server certbot python3-certbot-nginx

# 2. Install Node.js 20 LTS & PM2
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

sudo npm install -g pm2

# 3. Configure Firewall (UFW)
echo "🛡️ Configuring Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 4. Start & Enable Redis & PostgreSQL
sudo systemctl enable --now redis-server
sudo systemctl enable --now postgresql

echo "✅ Environment setup completed successfully!"
echo "👉 Next steps:"
echo " 1. Setup PostgreSQL Database and User"
echo " 2. Clone Repository to /var/www/aakash-ecom"
echo " 3. Configure backend/.env.production"
echo " 4. Run deploy/deploy-update.sh"
