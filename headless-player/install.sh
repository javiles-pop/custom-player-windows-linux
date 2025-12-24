#!/bin/bash

# Poppulo Headless Player Installation Script
# Installs the service and sets up auto-start on Linux

set -e

echo "Installing Poppulo Headless Player..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create user and directories
useradd -r -s /bin/false fwiplayer 2>/dev/null || true
mkdir -p /opt/poppulo-player
mkdir -p /home/fwiplayer/Poppulo/Content
chown -R fwiplayer:fwiplayer /home/fwiplayer

# Copy files
cp -r src/ /opt/poppulo-player/
cp package*.json /opt/poppulo-player/
chown -R fwiplayer:fwiplayer /opt/poppulo-player

# Install dependencies
cd /opt/poppulo-player
npm install --production

# Install systemd service
cp systemd/poppulo-player.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable poppulo-player

echo "Installation complete!"
echo "Start service: sudo systemctl start poppulo-player"
echo "Check status: sudo systemctl status poppulo-player"
echo "View logs: sudo journalctl -u poppulo-player -f"