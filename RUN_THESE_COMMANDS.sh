#!/bin/bash
# Run these commands to open firewall ports

echo "Opening firewall ports for network access..."

# Open port 8000 (Backend API)
sudo ufw allow 8000/tcp

# Open port 8080 (Frontend)
sudo ufw allow 8080/tcp

# Check status
echo ""
echo "Firewall status:"
sudo ufw status

echo ""
echo "Ports listening:"
ss -tulpn | grep -E ':(8000|8080)'

echo ""
echo "✅ Done! Now access from other devices at:"
echo "   http://192.168.100.10:8080"
