# Vercel Deployment Guide

## Quick Setup (Recommended)

The `vercel.json` file is already configured! Just follow these steps:

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and create a new project
2. Import your GitHub repository
3. **Vercel will automatically detect `vercel.json`** - no manual configuration needed!

### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:
- `MONGODB_URI` - Your MongoDB connection string (use MongoDB Atlas for production)
- `JWT_SECRET` - Secret key for JWT tokens
- `TMDB_API_KEY` - The Movie Database API key
- `OMDB_API_KEY` - OMDB API key (optional, for IMDB ratings)
- `CLOUDINARY_CLOUD_NAME` - (optional)
- `CLOUDINARY_API_KEY` - (optional)
- `CLOUDINARY_API_SECRET` - (optional)

### 4. Deploy!

Click "Deploy" and Vercel will:
- Install root dependencies (`npm install`)
- Install client dependencies (`cd client && npm install`)
- Build the React app (`npm run build`)
- Serve from `client/build`

## Build Commands Reference

The `vercel.json` uses:
- **Build Command:** `npm run vercel-build`
- **Output Directory:** `client/build`
- **Install Command:** `npm install`

This runs:
1. `npm install` (root dependencies)
2. `cd client && npm install` (client dependencies)
3. `cd client && npm run build` (build React app)

## Troubleshooting

### Error: "client: No such file or directory"
- Make sure all files are pushed to GitHub
- Check that `client/` folder exists in your repo
- Verify you're using the root directory (not `client`)

### Error: Build fails
- Check Vercel build logs for specific errors
- Ensure all environment variables are set
- Verify `package.json` files are correct

### API calls not working
- Make sure your backend is deployed separately (Vercel is only serving the frontend)
- Update API URLs in your frontend if needed
- Check CORS settings on your backend

## Alternative: Deploy Frontend and Backend Separately

### Frontend Only (Current Setup)
- Deploy to Vercel using the current `vercel.json`
- This will serve your React app

### Backend (Separate Service)
Deploy your Node.js backend to:
- **Railway** (recommended): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

Then update your frontend API calls to point to your backend URL.

