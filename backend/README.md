# AI Coach Backend

Computer Vision Athletic Assessment Platform - FastAPI Backend

## Setup Instructions

### Prerequisites
- Python 3.11+
- pip

### Installation

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
```

2. Activate the virtual environment:
- macOS/Linux: `source venv/bin/activate`
- Windows: `venv\Scripts\activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your credentials
```

5. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app initialization
│   ├── api/             # API routes
│   ├── core/            # Core utilities (config, auth, etc.)
│   ├── models/          # Pydantic models
│   └── services/        # Business logic services
├── requirements.txt
├── .env
└── README.md
```

## API Documentation

Once the server is running, visit http://localhost:8000/docs for interactive API documentation.

## Deployment

### Live URL
- **Production API**: https://ltad-coach-api.herokuapp.com
- **API Docs**: https://ltad-coach-api.herokuapp.com/docs
- **Health Check**: https://ltad-coach-api.herokuapp.com/health

### Heroku Deployment Setup

#### Prerequisites
1. Heroku account (free tier is sufficient)
2. GitHub repository connected to Heroku

#### Create New Heroku App

1. Go to https://dashboard.heroku.com/new-app
2. App name: `ltad-coach-api` (or your preferred name)
3. Region: United States (or closest to your users)
4. Click "Create app"

#### Connect GitHub Repository

1. Go to **Deploy** tab
2. Deployment method: **GitHub**
3. Search for your repository
4. Click **Connect**
5. Enable **Automatic Deploys** from `main` branch
6. Optional: Enable "Wait for CI to pass before deploy"

#### Configure Buildpacks

Heroku should auto-detect Python. If not:

1. Go to **Settings** tab
2. **Buildpacks** section
3. Click "Add buildpack"
4. Select `heroku/python`

#### Configure Environment Variables

Go to **Settings** > **Config Vars** and add the following:

**Required Environment Variables:**

```bash
# Environment
ENVIRONMENT=production

# Firebase Admin SDK - Option 1: Individual env vars
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY_ID=<from-service-account-json>
FIREBASE_PRIVATE_KEY=<from-service-account-json>
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_CLIENT_ID=<from-service-account-json>
FIREBASE_CLIENT_CERT_URL=<from-service-account-json>

# Firebase Admin SDK - Option 2: Base64 encoded JSON (alternative)
# GOOGLE_APPLICATION_CREDENTIALS_JSON=<base64-encoded-service-account>

# Firebase Storage
FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com

# OpenRouter API
OPENROUTER_API_KEY=<your-openrouter-api-key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Email Service
RESEND_API_KEY=<your-resend-api-key>

# CORS (Frontend URLs - comma separated)
ALLOWED_ORIGINS=https://ltad-coach.vercel.app,http://localhost:5173

# URLs
FRONTEND_URL=https://ltad-coach.vercel.app
API_BASE_URL=https://ltad-coach-api.herokuapp.com
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`, ensure newlines are preserved as `\n` (Heroku handles this automatically)
- Use production Firebase project credentials, not development
- `ALLOWED_ORIGINS` should include both production frontend URL and localhost for testing

### Deploy Manually via CLI

```bash
# Install Heroku CLI (macOS)
brew tap heroku/brew && brew install heroku

# Login to Heroku
heroku login

# Add Heroku remote (if not already added)
heroku git:remote -a ltad-coach-api

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://ltad-coach-api.herokuapp.com/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-12-10T18:30:00.000Z",
     "environment": "production",
     "version": "1.0.0"
   }
   ```

2. **Test API Documentation**
   - Visit: https://ltad-coach-api.herokuapp.com/docs
   - FastAPI's interactive docs should load

3. **Monitor Build Logs**
   - Go to Heroku Dashboard > Activity tab
   - Click on latest build
   - Or use CLI: `heroku logs --tail`

### Frontend Integration

Update your frontend `.env.production`:
```bash
VITE_API_URL=https://ltad-coach-api.herokuapp.com
```

### Troubleshooting

#### Build Fails

**Check build logs:**
```bash
heroku logs --tail
```

Common issues:
- **Missing dependencies**: Check `requirements.txt`
- **Python version**: Verify `runtime.txt` matches available versions
- **Procfile syntax**: Ensure no typos

#### App Crashes on Startup

**Check application logs:**
```bash
heroku logs --tail
```

Common issues:
- **Missing environment variables**: Verify all Config Vars are set
- **Firebase credentials invalid**: Verify service account JSON values
- **Import errors**: Ensure all dependencies in `requirements.txt`

#### H10 Error (App Crashed)

This means your app failed to start. Check:
1. Logs for Python errors
2. All environment variables are set correctly
3. Firebase initialization succeeds
4. Port binding uses `$PORT` environment variable (configured in Procfile)

#### Firebase Connection Fails

**Check:**
- All Firebase environment variables are set correctly
- `FIREBASE_PRIVATE_KEY` has proper format (with `\n` for newlines)
- Service account has correct permissions in Firebase Console
- Storage bucket name is correct and accessible

#### CORS Errors from Frontend

**Check:**
- `ALLOWED_ORIGINS` includes your frontend URL (e.g., Vercel deployment URL)
- Frontend is using correct API URL
- CORS middleware is properly configured in `app/main.py`

### Monitoring

#### View Logs

```bash
# Tail logs in real-time
heroku logs --tail

# View last 1000 lines
heroku logs -n 1000

# Filter by dyno
heroku logs --source app

# Search logs
heroku logs --tail | grep ERROR
```

#### Restart App

```bash
heroku restart
```

#### Scale Dynos

```bash
# Check current dyno status
heroku ps

# Scale up (if needed later)
heroku ps:scale web=2

# Scale down
heroku ps:scale web=1
```

### Production Notes

- **Free Tier**: Heroku free tier sleeps after 30 min of inactivity (first request will be slow)
- **Upgrade**: Consider upgrading to Hobby dyno ($7/mo) for always-on service
- **Logs**: Logs are retained for 1500 lines (use external logging service for production)
- **Database**: Firebase and storage are managed separately, not on Heroku
- **Monitoring**: Consider setting up Sentry or LogDNA for error tracking
