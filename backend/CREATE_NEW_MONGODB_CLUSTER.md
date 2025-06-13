# MongoDB Atlas Cluster Recreation Guide

## Why Create a New Cluster?
Your current cluster `interviewpilot.dijluqw.mongodb.net` has SSL/TLS compatibility issues that are preventing connections from both local environment and Render deployment.

## Steps to Create New Cluster:

### 1. Create New Cluster
- Go to MongoDB Atlas Dashboard
- Click "Create New Cluster"
- Choose **M0 Free Tier**
- Select **AWS** provider
- Choose **N. Virginia (us-east-1)** region (best for Render compatibility)
- Name: `interviewpilot-new`

### 2. Configure Database Access
- Go to Database Access → Add New Database User
- Username: `interviewpilot`
- Password: Generate a new strong password (save it!)
- Privileges: Read and write to any database

### 3. Configure Network Access
- Go to Network Access → Add IP Address
- Choose "Allow access from anywhere" (0.0.0.0/0)
- Comment: "Allow all IPs for deployment"

### 4. Get Connection String
- Go to Database → Connect → Connect your application
- Choose "Python" driver
- Copy the connection string:
  ```
  mongodb+srv://interviewpilot:<password>@interviewpilot-new.xxxxx.mongodb.net/interviewpilot?retryWrites=true&w=majority
  ```

### 5. Update Environment Variables
Update your `.env` file:
```
MONGODB_URL=mongodb+srv://interviewpilot:NEW_PASSWORD@interviewpilot-new.xxxxx.mongodb.net/interviewpilot?retryWrites=true&w=majority
```

### 6. Test Connection
Run the test script again with new connection string.

## Benefits of New Cluster:
- ✅ Fresh SSL/TLS configuration
- ✅ Better region selection for Render
- ✅ Latest MongoDB version
- ✅ Optimized network settings
- ✅ Clean slate without previous issues

## Alternative: MongoDB Community Cloud
If Atlas continues to have issues, consider:
- MongoDB Community Cloud (different provider)
- Render's own PostgreSQL (change database entirely)
- Supabase PostgreSQL (free tier with better compatibility)
