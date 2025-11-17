# Network Access Setup Guide

## Problem
The frontend was hardcoded to use `localhost:8000` which only works on the same machine. Other devices on your network couldn't connect.

## Solution
All hardcoded URLs have been replaced with the `VITE_API_BASE_URL` environment variable.

## Setup Instructions

### 1. For Local Development (Same Machine)
Your `.env` file should have:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 2. For Network Access (Other Devices - Phones, Tablets, etc.)
Update your `.env` file to use your machine's IP address:
```bash
VITE_API_BASE_URL=http://192.168.100.10:8000
```

**Your current local IP: `192.168.100.10`**

### 3. Finding Your Local IP Address
If your IP changes, run one of these commands:

**Linux/Mac:**
```bash
ip addr show | grep "inet " | grep -v "127.0.0.1"
# or
ifconfig | grep "inet " | grep -v "127.0.0.1"
```

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### 4. After Changing .env File
Restart the Vite development server:
```bash
npm run dev
# or
pnpm dev
```

## Backend Configuration

The backend is already configured correctly to accept connections from any IP:
```python
# In backend/main.py line 1000:
uvicorn.run(app, host="0.0.0.0", port=8000)
```

CORS is configured to allow:
- `http://localhost:8080`
- `http://192.168.100.10:8080` (your local network)
- Cloudflare Pages production URL

## Firewall Settings

Make sure port 8000 is open on your machine:

**Linux (ufw):**
```bash
sudo ufw allow 8000
```

**Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

## Testing

1. Start backend: `cd backend && python main.py`
2. Start frontend: `cd frontend && npm run dev`
3. On another device, navigate to: `http://192.168.100.10:8080` (or your actual frontend port)

## Production Deployment

For production, set `VITE_API_BASE_URL` to your actual API domain:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```
