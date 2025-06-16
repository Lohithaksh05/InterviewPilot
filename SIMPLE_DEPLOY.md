# 🚀 Simple Deployment Guide for InterviewPilot

Deploy your AI-powered interview platform using **Vercel** (frontend) and **Render** (backend) - two platforms with truly free tiers. Railway is no longer free after 30 days.

## ✅ Prerequisites (Already Completed)

- [x] **MongoDB Atlas**: Working connection string ✅
- [x] **Google Gemini API**: API key configured ✅  
- [x] **Local Testing**: Backend running successfully ✅
- [x] **GitHub Repository**: Push your code to GitHub
- [ ] **Render Account**: For backend deployment (FREE forever)
- [ ] **Vercel Account**: For frontend deployment (FREE)

---

## 📋 Quick Overview

1. **Push code to GitHub** (5 minutes)
2. **Deploy Backend to Render** (10 minutes) - FREE forever- FREE forever
3. **Deploy Frontend to Vercel** (5 minutes) - FREE
4. **Update CORS settings** (2 minutes)
5. **Test live application** (5 minutes)

**Total Time: ~30 minutes**

---

## Step 1: Push Code to GitHub

### 1.1 Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click "New Repository"
3. Name: `InterviewPilot`
4. Set to **Public** (for free deployments)
5. Don't initialize with README (you already have one)
6. Click "Create repository"

### 1.2 Push Your Code
Open PowerShell in your project directory and run:

```powershell
# Navigate to your project
cd c:\Users\lohit\InterviewPilot

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - InterviewPilot with MongoDB Atlas"

# Add your GitHub repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/InterviewPilot.git

# Push to GitHub
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 2: Deploy Backend to Render (FREE Forever!)

### 2.1 Create Render Account
1. Go to [Render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub
4. Authorize Render to access your repositories

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Select "Build and deploy from a Git repository"
3. Choose your `InterviewPilot` repository
4. Click "Connect"

### 2.3 Configure Service Settings
**Important Settings**:
- **Name**: `interviewpilot-backend`
- **Root Directory**: `backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python main.py`
- **Instance Type**: **Free** (select this!)

### 2.4 Set Environment Variables
Scroll down to "Environment Variables" and add these **exactly**:

```
MONGODB_URL=mongodb+srv://lohithaksh:lohit2005@interviewpilot.dijluqw.mongodb.net/interviewpilot
GOOGLE_API_KEY=AIzaSyBpl643Yz-UlYCxm7gh8a4iR2b6Cy-UB6E
GEMINI_API_KEY=AIzaSyBpl643Yz-UlYCxm7gh8a4iR2b6Cy-UB6E
ALLOWED_ORIGINS=*
DEBUG=False
HOST=0.0.0.0
PORT=10000
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_NAME=interviewpilot
```

**Note**: Render uses port 10000 by default, not 8000.

### 2.5 Deploy and Test
1. Click "Create Web Service"
2. Render will build and deploy (10-15 minutes for first deployment)
3. You'll get a URL like: `https://interviewpilot-backend.onrender.com`
4. **Copy this URL** - you'll need it for frontend!
5. Test by visiting: `https://your-render-url.onrender.com/` - should show API message

**Important**: Free Render services sleep after 15 minutes of inactivity and take ~30 seconds to wake up.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [Vercel.com](https://vercel.com)
2. Click "Sign up with GitHub"
3. Authorize Vercel

### 3.2 Import Project
1. Click "New Project"
2. Find your `InterviewPilot` repository
3. Click "Import"

### 3.3 Configure Project Settings
**Important Settings**:
- **Framework Preset**: Vite (should auto-detect)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### 3.4 Set Environment Variables
Before deploying, click "Environment Variables" and add:

```
Variable Name: VITE_API_BASE_URL
Value: https://your-render-url.onrender.com/api
```

**Replace** `your-render-url.onrender.com` with your actual Render URL from Step 2.5.

### 3.5 Deploy
1. Click "Deploy"
2. Vercel will build and deploy (3-5 minutes)
3. You'll get a URL like: `https://interview-pilot-xxx.vercel.app`
4. **Save this URL** - this is your live application!

---

## Step 4: Update CORS Settings

### 4.1 Update Render CORS
Your frontend and backend need to communicate:

1. Go back to Render dashboard
2. Go to "Environment" tab
3. Update `ALLOWED_ORIGINS` variable to:
   ```
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
   ```
4. **Replace** with your actual Vercel URL from Step 3.5
5. Render will auto-redeploy (3-5 minutes)

---

## Step 5: Test Your Live Application! 🎉

### 5.1 Basic Functionality Test
Visit your Vercel URL and test:
- [x] Home page loads
- [x] Sign up / Login works
- [x] Resume upload (PDF/DOCX)
- [x] Job description input
- [x] Start interview session

### 5.2 Advanced Features Test
- [x] **Live Speech & Recording**: Test enhanced live speech
- [x] **AI Question Generation**: Verify questions appear
- [x] **Audio Playback**: Check recordings play in Results
- [x] **Cross-device**: Try from mobile/different browsers

---

## 🎯 Your Live URLs

After successful deployment:

- **🌐 Live Application**: `https://your-app.vercel.app`
- **🔧 Backend API**: `https://your-app.onrender.com`
- **💾 Database**: MongoDB Atlas (already configured)

---

## 🔧 Troubleshooting

### Backend Issues (Render)
**Problem**: API not responding
- **Solution**: Check Render dashboard → "Logs"
- **Check**: Environment variables are set correctly
- **Verify**: MongoDB connection string is correct
- **Note**: Free Render services sleep after 15 min inactivity

**Problem**: Build fails
- **Solution**: Ensure `requirements.txt` is in backend folder
- **Check**: Render root directory is set to `backend`

### Frontend Issues (Vercel)
**Problem**: Build fails
- **Solution**: Check Vercel deployment logs
- **Verify**: `package.json` is in frontend folder
- **Check**: Node.js version compatibility

**Problem**: API calls fail
- **Solution**: Verify `VITE_API_BASE_URL` ends with `/api`
- **Check**: Render backend is running properly
- **Note**: First API call may be slow (Render waking up)

### CORS Issues
**Problem**: "CORS policy" errors in browser
- **Solution**: Update Render `ALLOWED_ORIGINS` with your Vercel URL
- **Format**: `https://your-app.vercel.app,http://localhost:5173`

### MongoDB Issues
**Problem**: Database connection fails
- **Solution**: Check MongoDB Atlas network access (0.0.0.0/0)
- **Verify**: Connection string credentials are correct

---

## 💰 Cost Breakdown (100% FREE!)

### Free Tiers:
- **MongoDB Atlas**: Free M0 tier (512MB storage) - Forever
- **Render**: Free tier (750 hours/month, sleeps after 15min) - Forever  
- **Vercel**: Free tier (100GB bandwidth, unlimited sites) - Forever

### Expected Monthly Costs:
- **ALL MONTHS**: Completely FREE! 🎉

**Note**: Render free tier has limitations:
- Services sleep after 15 minutes of inactivity
- ~30 seconds to wake up on first request
- 750 hours/month limit (more than enough for personal projects)

---

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit API keys to GitHub
2. **CORS**: Restrict to specific domains in production
3. **MongoDB**: Consider IP restrictions for production
4. **JWT Secret**: Use strong, unique secret keys

---

## 🚀 Success! Your App is Live!

**Congratulations!** Your AI-powered interview platform is now accessible worldwide at your Vercel URL.

### Share Your Achievement:
- **Portfolio**: Add to your developer portfolio
- **LinkedIn**: Share your deployed project
- **Friends/Family**: Let them try your AI interviewer
- **Employers**: Showcase your full-stack + AI skills

---

## 🔄 Making Updates

### To Update Your App:
1. **Make changes locally**
2. **Test thoroughly**
3. **Commit and push to GitHub**:
   ```powershell
   git add .
   git commit -m "Your update description"
   git push
   ```
4. **Auto-deploy**: Both Vercel and Railway will auto-deploy!

---

## 🎯 What You've Accomplished

✅ **Full-Stack Development**: FastAPI + React
✅ **AI Integration**: Google Gemini for interview questions
✅ **Database Management**: MongoDB Atlas cloud database
✅ **Real-time Features**: Live speech transcription & recording
✅ **Cloud Deployment**: Professional-grade deployment pipeline
✅ **DevOps Skills**: Environment configuration, CORS, security

**This is a portfolio-worthy project that demonstrates modern software development skills!**

---

*Happy Deploying! 🎉 Your InterviewPilot is ready to help job seekers worldwide!*