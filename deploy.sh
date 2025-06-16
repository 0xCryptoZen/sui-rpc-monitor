#!/bin/bash

# Sui RPC Monitor - Ubuntu Deployment Script
# This script sets up and deploys the application on Ubuntu server

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="sui-rpc-monitor"
APP_DIR="/opt/$APP_NAME"
SERVICE_NAME="$APP_NAME.service"
PORT=3000
NODE_VERSION="23.3.0"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_status "Starting deployment of Sui RPC Monitor..."

# Update system packages
print_status "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required system packages
print_status "Installing required system packages..."
apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx

# Install Node.js using nvm
print_status "Installing Node.js v${NODE_VERSION}..."
if ! command -v nvm &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Source nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install $NODE_VERSION
nvm use $NODE_VERSION
nvm alias default $NODE_VERSION

# Install Bun
print_status "Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR

# Copy application files
print_status "Copying application files..."
cp -r ./* $APP_DIR/
cd $APP_DIR

# Install dependencies
print_status "Installing dependencies with Bun..."
bun install

# Build the application
print_status "Building the application..."
bun run build

# Create systemd service file
print_status "Creating systemd service..."
cat > /etc/systemd/system/$SERVICE_NAME << EOF
[Unit]
Description=Sui RPC Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
Environment="PORT=$PORT"
Environment="PATH=/root/.nvm/versions/node/v$NODE_VERSION/bin:/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/root/.bun/bin/bun start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$APP_NAME

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
print_status "Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name _;  # Replace with your domain

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # For Server-Sent Events
        proxy_set_header Cache-Control no-cache;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Enable and start the service
print_status "Starting the application service..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Check service status
sleep 3
if systemctl is-active --quiet $SERVICE_NAME; then
    print_status "Service is running successfully!"
else
    print_error "Service failed to start. Check logs with: journalctl -u $SERVICE_NAME"
    exit 1
fi

# Configure firewall
print_status "Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

print_status "Deployment completed successfully!"
print_warning "Next steps:"
echo "  1. Update Nginx server_name with your domain"
echo "  2. Run 'certbot --nginx' to enable HTTPS"
echo "  3. Monitor logs with: journalctl -u $SERVICE_NAME -f"
echo "  4. Access the application at: http://$(curl -s ifconfig.me)"