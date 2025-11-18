# Deploy Backend to Render - Step by Step

Your backend is ready to deploy! Follow these steps:

## Step 1: Push Code to GitHub (if not already done)

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Deploy to Render

1. **Go to Render**: https://dashboard.render.com/
   - Sign up or log in with your GitHub account

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `ponksebti-cmd/evolution`
   - Select the repository

3. **Configure the Service**:
   - **Name**: `evolution-backend`
   - **Region**: Choose closest to Algeria (Frankfurt or Paris)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

4. **Add Environment Variables** (Click "Add Environment Variable" for each):
   
   **Required Firebase Variables:**
   - `FIREBASE_PROJECT_ID` = (your Firebase project ID)
   - `FIREBASE_API_KEY` = (your Firebase API key)
   - `FIREBASE_AUTH_DOMAIN` = (your Firebase auth domain)
   - `FIREBASE_STORAGE_BUCKET` = (your Firebase storage bucket)
   - `FIREBASE_MESSAGING_SENDER_ID` = (your Firebase sender ID)
   - `FIREBASE_APP_ID` = (your Firebase app ID)
   - `FIREBASE_WEB_API_KEY` = (your Firebase web API key)
   
   **Required LLM Variables:**
   - `LLM_PROVIDER` = `groq` (or `gemini`)
   - `GROQ_API_KEY` = (your Groq API key)
   
   **Optional Variables:**
   - `GEMINI_API_KEY` = (your Gemini API key - optional)
   - `TAVILY_API_KEY` = (your Tavily API key - for web search)
   - `QDRANT_URL` = (your Qdrant URL - for education RAG)
   - `QDRANT_API_KEY` = (your Qdrant API key - for education RAG)

5. **Create Web Service**:
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - You'll get a URL like: `https://evolution-backend.onrender.com`

## Step 3: Update Frontend (Cloudflare Pages)

1. **Go to Cloudflare Pages Dashboard**: https://dash.cloudflare.com/
   - Select your `hadra` project

2. **Add Environment Variable**:
   - Go to: Settings → Environment variables
   - Click "Add variable"
   - **Variable name**: `VITE_API_BASE_URL`
   - **Value**: `https://evolution-backend.onrender.com` (your Render URL)
   - **Environment**: Production (and Preview if needed)
   - Click "Save"

3. **Redeploy Frontend**:
   - Go to: Deployments
   - Click "..." on latest deployment → "Retry deployment"
   - OR push a new commit to trigger automatic deployment

## Step 4: Test on Your Phone

1. Visit: `https://hadra.pages.dev`
2. Try logging in and sending a message
3. Everything should work now! 🎉

---

## Troubleshooting

### Backend won't start on Render
- Check logs in Render dashboard
- Verify all environment variables are set correctly
- Make sure Firebase credentials are correct

### Frontend can't connect to backend
- Check that `VITE_API_BASE_URL` is set in Cloudflare Pages
- Check browser console for CORS errors
- Verify your backend URL is accessible: `https://your-backend.onrender.com/`

### CORS Errors
The backend is already configured to allow all origins (`*`), so this shouldn't be an issue.

---

## Your Environment Variables Needed

You need to get these from your local `.env` files:

**From `backend/.env`:**
- All Firebase credentials
- GROQ_API_KEY or GEMINI_API_KEY
- Other API keys

**Note**: The `.env` files are not pushed to GitHub for security, so you need to copy them manually to Render.
