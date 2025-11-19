#!/bin/bash

# Run Backend Publicly with ngrok

echo "🌐 Starting Public Server"
echo "========================"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    
    # Download and install ngrok
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Detected Linux system"
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
          sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
          echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
          sudo tee /etc/apt/sources.list.d/ngrok.list && \
          sudo apt update && sudo apt install ngrok
    else
        echo "❌ Please install ngrok manually from: https://ngrok.com/download"
        exit 1
    fi
fi

echo "✅ ngrok is installed"
echo ""

# Check if backend server is running
if ! lsof -i:8000 &> /dev/null; then
    echo "🚀 Starting backend server..."
    cd backend
    python main.py &
    BACKEND_PID=$!
    cd ..
    sleep 3
    echo "✅ Backend running (PID: $BACKEND_PID)"
else
    echo "✅ Backend already running on port 8000"
fi

echo ""
echo "🌍 Creating public tunnel with ngrok..."
echo ""
echo "Your public URL will appear below:"
echo "===================================="
./ngrok http 8000
