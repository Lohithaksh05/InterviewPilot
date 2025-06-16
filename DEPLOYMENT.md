# 🚀 InterviewPilot Deployment Guide

## Quick Deploy Options

### Option 1: Vercel + Railway (Recommended - FREE)

#### Backend Deployment (Railway)
1. Go to [Railway.app](https://railway.app/) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repo and select the `backend` folder
4. Set environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `MONGODB_URL`: Your MongoDB connection string
   - `JWT_SECRET_KEY`: Generate with `openssl rand -hex 32`
   - `ALLOWED_ORIGINS`: `https://your-app.vercel.app`
5. Deploy automatically!

#### Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and sign up
2. Click "New Project" → Import your GitHub repo
3. Set root directory to `frontend`
4. Set environment variable:
   - `VITE_API_BASE_URL`: `https://your-railway-app.railway.app/api`
5. Deploy automatically!

### Option 2: Render (All-in-One)

#### Backend on Render
1. Go to [Render.com](https://render.com/) and sign up
2. Click "New" → "Web Service"
3. Connect GitHub repo, select `backend` folder
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (same as Railway)

#### Frontend on Render
1. Click "New" → "Static Site"
2. Connect GitHub repo, select `frontend` folder
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variable: `VITE_API_BASE_URL`

### Option 3: Docker + Any Platform

```bash
# Build and run with Docker
cd backend
docker build -t interview-pilot-backend .
docker run -p 8000:8000 --env-file .env interview-pilot-backend

cd ../frontend
npm run build
# Serve dist folder with any static hosting
```

## Environment Variables Setup

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URL=mongodb+srv://...
JWT_SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=https://your-frontend-domain.com
DEBUG=False
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## Database Setup

### MongoDB Atlas (Free)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to `MONGODB_URL` environment variable

## API Keys Required

### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `GEMINI_API_KEY` environment variable

## Custom Domain (Optional)

### Vercel Custom Domain
1. In Vercel dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Railway Custom Domain
1. In Railway project → Settings → Domains
2. Add custom domain
3. Update DNS records

## Monitoring & Logs

- **Railway**: Built-in logs and metrics
- **Vercel**: Function logs and analytics
- **Render**: Application logs and metrics

## Security Checklist

✅ Environment variables set correctly
✅ CORS origins restricted to your domains
✅ JWT secret key is strong and secret
✅ Database credentials are secure
✅ API keys are not exposed in frontend code
✅ HTTPS enabled (automatic on most platforms)

## Troubleshooting

### Common Issues
1. **CORS errors**: Check `ALLOWED_ORIGINS` includes your frontend domain
2. **API not found**: Verify `VITE_API_BASE_URL` is correct
3. **Database connection**: Check `MONGODB_URL` format and credentials
4. **Build failures**: Ensure all dependencies in requirements.txt/package.json

### Getting Help
- Check platform-specific logs
- Verify all environment variables are set
- Test API endpoints manually
- Check browser network tab for errors

## Cost Estimate

### Free Tier (Recommended for testing)
- **Vercel**: Free (100GB bandwidth/month)
- **Railway**: Free ($5 credit/month)
- **MongoDB Atlas**: Free (512MB storage)
- **Total**: FREE

### Production Tier
- **Vercel Pro**: $20/month
- **Railway**: ~$5-20/month depending on usage
- **MongoDB Atlas**: $9+/month
- **Total**: ~$35-50/month

## Performance Optimization

1. **Frontend**:
   - Enable gzip compression
   - Optimize images
   - Code splitting (already configured)

2. **Backend**:
   - Use connection pooling
   - Add caching for API responses
   - Monitor response times

3. **Database**:
   - Index frequently queried fields
   - Monitor query performance
   - Use read replicas for scaling
