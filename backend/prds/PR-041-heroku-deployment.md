---
id: BE-041
depends_on: [BE-001, BE-002, BE-003]
blocks: []
priority: HIGH
execute_early: true
---

# BE-041: Heroku Deployment Setup

## Scope

**In Scope:**
- Heroku app creation and configuration
- Python runtime configuration
- Environment variables setup
- Automatic deployment on git push
- Database connection (Firebase Admin)
- Health check endpoint

**Out of Scope:**
- Frontend deployment (FE-031)
- Custom domain SSL
- Horizontal scaling configuration
- CI/CD pipelines (can use Heroku's auto-deploy)

## Technical Decisions

- **Platform**: Heroku (easy Python deployment, free dyno for MVP)
- **Dyno Type**: Web dyno (basic)
- **Deploy Trigger**: Auto-deploy on push to `main` branch
- **Python Version**: 3.11
- **Process Manager**: Uvicorn (ASGI server for FastAPI)
- **Workers**: 1 (can scale later)

## Acceptance Criteria

- [ ] Heroku app created and connected to GitHub
- [ ] Auto-deployment works on push to `main`
- [ ] Environment variables configured
- [ ] Build succeeds and app starts
- [ ] Health check endpoint accessible (e.g., `https://ltad-coach-api.herokuapp.com/health`)
- [ ] Firebase Admin SDK works in production
- [ ] CORS configured to allow frontend domain

## Files to Create

- `backend/Procfile`
- `backend/runtime.txt`
- `backend/heroku.yml` (optional - for custom build)
- Update `backend/app/main.py` with health check endpoint
- Update `backend/README.md` with deployment info

## Implementation Notes

### Step 1: Install Heroku CLI (Optional for local testing)

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Create Procfile

**backend/Procfile**:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**What this does**:
- `web`: Tells Heroku this is a web process
- `uvicorn`: ASGI server for FastAPI
- `app.main:app`: Path to your FastAPI app instance
- `--host 0.0.0.0`: Bind to all interfaces
- `--port $PORT`: Use Heroku's assigned port

### Step 3: Create runtime.txt

**backend/runtime.txt**:
```
python-3.11.7
```

This specifies the exact Python version Heroku should use.

### Step 4: Update requirements.txt

Ensure your `backend/requirements.txt` includes all production dependencies:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
firebase-admin==6.3.0
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
anthropic==0.7.0
mediapipe==0.10.9
opencv-python-headless==4.8.1.78
numpy==1.26.2
resend==0.7.0
python-multipart==0.0.6
```

**Note**: Use `opencv-python-headless` instead of `opencv-python` for server environments (no GUI needed).

### Step 5: Add Health Check Endpoint

**backend/app/main.py** - Add this endpoint:

```python
from fastapi import FastAPI
from datetime import datetime
import os

app = FastAPI(title="LTAD Coach API", version="1.0.0")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and deployment verification
    """
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "production"),
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "LTAD Coach API",
        "docs": "/docs",
        "health": "/health"
    }
```

### Step 6: Heroku Dashboard Setup

#### Create New App

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

### Step 7: Configure Environment Variables

Go to **Settings** → **Config Vars** and add:

```
# Environment
ENVIRONMENT=production

# Firebase Admin SDK
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY_ID=<from-service-account-json>
FIREBASE_PRIVATE_KEY=<from-service-account-json>
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_CLIENT_ID=<from-service-account-json>
FIREBASE_CLIENT_CERT_URL=<from-service-account-json>

# Or use base64 encoded service account JSON
GOOGLE_APPLICATION_CREDENTIALS_JSON=<base64-encoded-service-account>

# Anthropic API
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Email Service
RESEND_API_KEY=<your-resend-api-key>

# CORS (Frontend URL)
ALLOWED_ORIGINS=https://ltad-coach.vercel.app,http://localhost:5173

# Storage
FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com
```

**Important Notes**:
- For `FIREBASE_PRIVATE_KEY`, replace `\n` with actual newlines or use base64 encoding
- Use production Firebase project, not development
- `ALLOWED_ORIGINS` should include both production frontend and localhost for development

### Step 8: Update CORS Configuration

**backend/app/main.py** - Update CORS middleware:

```python
from fastapi.middleware.cors import CORSMiddleware
import os

# Get allowed origins from environment
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 9: Firebase Admin SDK with Environment Variables

**backend/app/services/firebase_service.py**:

```python
import firebase_admin
from firebase_admin import credentials
import os
import json
import base64

def initialize_firebase():
    """
    Initialize Firebase Admin SDK
    Works both locally (with service account file) and on Heroku (with env vars)
    """
    if firebase_admin._apps:
        return firebase_admin.get_app()

    # Production (Heroku) - use environment variables
    if os.getenv("ENVIRONMENT") == "production":
        # Option 1: Individual env vars
        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
        }

        # Option 2: Base64 encoded JSON (alternative)
        # cred_json = base64.b64decode(os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON"))
        # cred_dict = json.loads(cred_json)

        cred = credentials.Certificate(cred_dict)
    else:
        # Local development - use service account file
        cred = credentials.Certificate("path/to/serviceAccountKey.json")

    firebase_admin.initialize_app(cred, {
        'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET")
    })

    return firebase_admin.get_app()
```

### Step 10: Update README

**backend/README.md** - Add deployment section:

```markdown
## Deployment

### Live URL
- **Production API**: https://ltad-coach-api.herokuapp.com
- **API Docs**: https://ltad-coach-api.herokuapp.com/docs
- **Health Check**: https://ltad-coach-api.herokuapp.com/health

### Deploy Manually
\`\`\`bash
# Login to Heroku
heroku login

# Deploy
git push heroku main

# View logs
heroku logs --tail
\`\`\`

### Environment Variables
Required environment variables (set in Heroku Dashboard):
- `ENVIRONMENT=production`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CLIENT_CERT_URL`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `ALLOWED_ORIGINS`
- `FIREBASE_STORAGE_BUCKET`
```

## Testing

### Local Testing with Production Config

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export ENVIRONMENT=production
export FIREBASE_PROJECT_ID=your-project-id
# ... (set other vars)

# Run with uvicorn (same as Heroku)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Verify Deployment

1. **Trigger Deployment**
   ```bash
   git add backend/
   git commit -m "Add Heroku deployment config"
   git push origin main
   ```

2. **Monitor Build Logs**
   - Go to Heroku Dashboard → Activity tab
   - Click on latest build
   - Or use CLI: `heroku logs --tail`

3. **Check Health Endpoint**
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

4. **Test API Documentation**
   - Visit: `https://ltad-coach-api.herokuapp.com/docs`
   - FastAPI's interactive docs should load

5. **Test Firebase Connection**
   ```bash
   curl https://ltad-coach-api.herokuapp.com/api/auth/verify \
     -H "Authorization: Bearer <test-token>"
   ```

### Test from Frontend

Update your frontend `.env.production`:
```
VITE_API_URL=https://ltad-coach-api.herokuapp.com
```

Deploy frontend and test end-to-end connectivity.

## Troubleshooting

### Build Fails

**Check build logs**:
```bash
heroku logs --tail
```

Common issues:
- **Missing dependencies**: Check `requirements.txt`
- **Python version**: Verify `runtime.txt` matches available versions
- **Procfile syntax**: Ensure no typos

### App Crashes on Startup

**Check application logs**:
```bash
heroku logs --tail
```

Common issues:
- **Missing environment variables**: Check Config Vars
- **Firebase credentials invalid**: Verify service account JSON
- **Import errors**: Ensure all dependencies in `requirements.txt`

### H10 Error (App Crashed)

This means your app failed to start. Check:
1. Logs for Python errors
2. Environment variables are set
3. Firebase initialization succeeds
4. Port binding uses `$PORT` environment variable

### Firebase Connection Fails

**Check**:
- `FIREBASE_PRIVATE_KEY` has actual newlines, not `\n` strings
- All Firebase env vars are set correctly
- Service account has correct permissions in Firebase Console
- Storage bucket exists and is accessible

### CORS Errors from Frontend

**Check**:
- `ALLOWED_ORIGINS` includes your Vercel URL
- Frontend is using correct API URL
- CORS middleware is properly configured

## Monitoring

### View Logs

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

### Restart App

```bash
heroku restart
```

### Scale Dynos

```bash
# Check current dyno status
heroku ps

# Scale up (if needed later)
heroku ps:scale web=2

# Scale down
heroku ps:scale web=1
```

## Estimated Complexity

**Size**: S (Small - ~1 hour including config and testing)

## Notes

- **Execute this PR early** - Having a live backend enables:
  - Frontend integration testing in production
  - End-to-end testing with real Firebase
  - API documentation accessible to team
  - Early detection of deployment issues
- Heroku free tier sleeps after 30 min of inactivity (first request will be slow)
- Consider upgrading to Hobby dyno ($7/mo) for always-on service
- Logs are retained for 1500 lines (use external logging service for production)
- Database (Firebase) and storage are managed separately, not on Heroku

## Post-Deployment Checklist

- [ ] Share API URL with frontend team
- [ ] Test health endpoint
- [ ] Verify API docs accessible
- [ ] Test Firebase connection in production
- [ ] Update frontend environment variables with API URL
- [ ] Set up monitoring (optional: Sentry, LogDNA)
- [ ] Document any production-specific configuration
