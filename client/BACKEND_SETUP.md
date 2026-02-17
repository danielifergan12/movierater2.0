# Backend Setup Guide

## Problem
The frontend is deployed on Vercel, but it needs to connect to your backend API. Currently, API calls are failing because there's no backend server running.

## Solution
You need to deploy your backend separately and configure the frontend to use it.

## Step 1: Deploy Backend

Choose one of these platforms:

### Option A: Railway (Recommended - Easy & Free)
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `movierater2.0` repository
5. Railway will detect it's a Node.js app
6. Add environment variables:
   - `MONGODB_URI` - Your MongoDB connection string (use MongoDB Atlas)
   - `JWT_SECRET` - Secret key for JWT tokens
   - `TMDB_API_KEY` - The Movie Database API key
   - `OMDB_API_KEY` - OMDB API key (optional)
   - `PORT` - Set to `5000` or leave default
7. Deploy!

### Option B: Render
1. Go to https://render.com
2. Create a new "Web Service"
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. Add all environment variables
6. Deploy!

### Option C: Heroku
1. Install Heroku CLI
2. Run:
   ```bash
   heroku create your-app-name
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   # ... add all other env vars
   git push heroku main
   ```

## Step 2: Configure Frontend

Once your backend is deployed, you'll get a URL like:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Heroku: `https://your-app.herokuapp.com`

### Add Environment Variable in Vercel:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add a new variable:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** Your backend URL (e.g., `https://your-app.railway.app`)
4. Save
5. **Redeploy** your Vercel project

## Step 3: Update CORS on Backend

Make sure your backend allows requests from your Vercel domain:

In `server.js`, update CORS:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

## Step 4: Test

1. Try logging in on your deployed site
2. Check browser console for any errors
3. Verify API calls are going to your backend URL

## Troubleshooting

### Still getting "Login failed"?
- Check that `REACT_APP_API_URL` is set in Vercel
- Verify your backend is running and accessible
- Check CORS settings on backend
- Look at browser console for specific error messages

### Backend not responding?
- Check Railway/Render/Heroku logs
- Verify all environment variables are set
- Make sure MongoDB connection is working
- Test backend directly: `curl https://your-backend-url.com/api/auth/me`

## Quick Test

To test if your backend is working:
```bash
curl https://your-backend-url.com/api/movies/trending/week
```

If it returns movie data, your backend is working!

