# Public Backend Deployment Guide

Your backend is now ready to be deployed publicly! Choose one of these options:

## Option 1: Render (Recommended - Free Tier Available)

### Steps:
1. **Create a Render account**: https://render.com (sign up with GitHub)
2. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/evolution.git
   git push -u origin main
   ```
3. **Deploy on Render**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch
   - Fill in the deployment settings:
     - **Name**: `evolution-backend`
     - **Environment**: Python
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables (from `.env` file):
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_API_KEY`
     - `FIREBASE_AUTH_DOMAIN`
     - `FIREBASE_STORAGE_BUCKET`
     - `FIREBASE_MESSAGING_SENDER_ID`
     - `FIREBASE_APP_ID`
     - `FIREBASE_WEB_API_KEY`
     - `GROQ_API_KEY` (or `GEMINI_API_KEY`)
     - `TAVILY_API_KEY`
     - `LLM_PROVIDER` = `groq` or `gemini`
   - Click "Create Web Service"

4. **Get your public URL**: After deployment, you'll get a URL like:
   - `https://evolution-backend.onrender.com`

5. **Update your frontend** to use this URL:
   - In `frontend/src/lib/api.ts`, change the API base URL

---

## Option 2: Railway

### Steps:
1. **Create a Railway account**: https://railway.app (sign up with GitHub)
2. **Push your code to GitHub** (same as Render)
3. **Deploy on Railway**:
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect and deploy
4. **Configure Environment Variables**:
   - Go to Project Settings → Variables
   - Add all environment variables from `.env`
5. **Get your public URL** and update frontend

---

## Option 3: Heroku (Legacy - Free Tier Removed)

Heroku discontinued free tier in 2022. Use Render or Railway instead.

---

## Option 4: Using ngrok for Quick Testing

If you want to test public access immediately without full deployment:

```bash
# Install ngrok
# MacOS: brew install ngrok
# Linux: apt-get install ngrok or download from https://ngrok.com/download

# Run your backend locally
cd backend
python main.py

# In another terminal, expose it publicly
ngrok http 8000

# You'll get a URL like: https://abc123.ngrok.io
```

⚠️ **Note**: ngrok URLs are temporary and change on restart. Use Render/Railway for permanent public deployment.

---

## After Deployment

1. **Update Frontend** (`frontend/src/lib/api.ts`):
   ```typescript
   const API_BASE_URL = process.env.VITE_API_URL || 'https://your-backend-url.onrender.com';
   ```

2. **Update CORS Settings** if needed:
   - Edit `backend/main.py` and add your frontend domain to `allowed_origins`

3. **Test the connection**:
   ```bash
   curl https://your-backend-url/
   ```

---

## Environment Variables Needed

Create a `.env` file in the `backend/` directory with:

```
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx
FIREBASE_WEB_API_KEY=xxx
LLM_PROVIDER=groq
GROQ_API_KEY=xxx
GEMINI_API_KEY=xxx (optional)
TAVILY_API_KEY=xxx
QDRANT_URL=xxx (optional)
QDRANT_API_KEY=xxx (optional)
```

---

## Troubleshooting

### Backend starts but frontend can't connect
- Check CORS settings in `backend/main.py`
- Verify environment variables are set on the hosting service
- Check browser console for errors (Network tab)

### 502 Bad Gateway Error
- Check backend logs on the hosting platform
- Verify all environment variables are configured
- Ensure requirements.txt has all dependencies

### Timeout Errors
- Streaming responses need proper configuration
- Render/Railway handle this automatically

---

## Need Help?

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
