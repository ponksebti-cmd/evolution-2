#!/bin/bash

# Quick Deploy Script - Evolution Backend

echo "🚀 Evolution Backend - Quick Deploy Helper"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "Please create backend/.env with your API keys first."
    exit 1
fi

echo "📋 Your environment variables from backend/.env:"
echo "------------------------------------------------"
grep -v '^#' backend/.env | grep -v '^$'
echo ""
echo "⚠️  IMPORTANT: You'll need to copy these to Render manually!"
echo ""

# Check Git status
echo "📦 Checking Git status..."
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository. Initializing..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git initialized"
else
    echo "✅ Git repository found"
    
    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        echo "⚠️  You have uncommitted changes:"
        git status -s
        echo ""
        read -p "Do you want to commit and push now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "Deploy: Ready for production"
            git push origin main
            echo "✅ Changes committed and pushed"
        fi
    else
        echo "✅ No uncommitted changes"
    fi
fi

echo ""
echo "🌐 Your GitHub repository:"
git remote get-url origin
echo ""
echo "📝 Next Steps:"
echo "1. Open Render: https://dashboard.render.com/"
echo "2. Sign in with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Select your repository: ponksebti-cmd/evolution"
echo "5. Follow the instructions in DEPLOY_TO_RENDER.md"
echo ""
echo "✨ Your backend will be live at: https://evolution-backend.onrender.com"
echo ""
