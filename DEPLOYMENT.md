# Vercel Deployment Guide

## Option 1: Deploy Frontend and Backend Separately (Recommended)

### Deploy Frontend (React App)

1. Go to [Vercel](https://vercel.com) and create a new project
2. Import your GitHub repository
3. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

4. Add Environment Variables (if needed):
   - `REACT_APP_API_URL` = Your backend API URL

### Deploy Backend (Node.js API)

1. Create another Vercel project
2. Import the same GitHub repository
3. Configure:
   - **Root Directory:** `.` (root)
   - **Build Command:** (leave empty or `npm install`)
   - **Output Directory:** (leave empty)
   - **Framework Preset:** Other

4. Create `api/index.js` (see below)

5. Add Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `TMDB_API_KEY`
   - `OMDB_API_KEY` (optional)
   - All other variables from your `.env`

## Option 2: Single Deployment (Current Setup)

The `vercel.json` file is configured for single deployment. Make sure:

1. All client files are pushed to GitHub
2. In Vercel settings:
   - **Root Directory:** Leave empty (root)
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/build`
   - **Install Command:** `npm install`

## Troubleshooting

If you get "client: No such file or directory":
- Make sure all files are pushed to GitHub
- Check that `client/` folder exists in your repo
- Verify the root directory setting in Vercel

