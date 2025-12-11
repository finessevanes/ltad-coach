# Cloud Run Deployment Guide

Complete guide to deploy the LTAD Coach backend to Google Cloud Run.

## Why Cloud Run?

- **Same ecosystem as Firebase**: Firestore, Storage, and Auth all in one Google Cloud project
- **Automatic credentials**: No need for service account JSON files in production
- **Auto-scaling**: Scales from 0 to 1000+ instances based on traffic
- **Pay-per-use**: Only pay when handling requests (much cheaper than always-on servers)
- **Perfect for compute-heavy workloads**: MediaPipe + OpenCV video processing

## Prerequisites

1. **Google Cloud CLI installed**
2. **Docker Desktop installed** (optional - only needed for local testing)
3. **Firebase project** (you already have this: `ltad-coach`)
4. **API Keys**:
   - OpenRouter API key
   - Resend API key

## Step 1: Install Google Cloud CLI

### On Mac:
```bash
brew install google-cloud-sdk
```

### Verify installation:
```bash
gcloud --version
```

You should see output like: `Google Cloud SDK 456.0.0`

## Step 2: Authenticate and Configure

### Login to Google Cloud:
```bash
gcloud auth login
```

This will open a browser window. Sign in with the Google account that owns your Firebase project.

### Set your project:
```bash
# Replace 'ltad-coach' with your actual Firebase project ID if different
gcloud config set project ltad-coach
```

### Enable required APIs:
```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API (for building containers)
gcloud services enable cloudbuild.googleapis.com

# Enable Artifact Registry API (for storing container images)
gcloud services enable artifactregistry.googleapis.com
```

## Step 3: Set Up Secrets (Recommended)

Instead of passing API keys as environment variables, use Google Secret Manager for better security.

### Create secrets:
```bash
# Create OpenRouter API key secret
echo -n "sk-or-v1-YOUR_ACTUAL_KEY" | gcloud secrets create openrouter-key \
  --data-file=- \
  --replication-policy="automatic"

# Create Resend API key secret
echo -n "re_YOUR_ACTUAL_KEY" | gcloud secrets create resend-key \
  --data-file=- \
  --replication-policy="automatic"
```

### Grant Cloud Run access to secrets:
```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe ltad-coach --format="value(projectNumber)")

# Grant access to secrets
gcloud secrets add-iam-policy-binding openrouter-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding resend-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 4: Deploy to Cloud Run

### Navigate to backend directory:
```bash
cd backend
```

### Deploy with secrets (recommended):
```bash
gcloud run deploy ltad-coach-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300s \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "ENVIRONMENT=production,FIREBASE_STORAGE_BUCKET=ltad-coach.firebasestorage.app,OPENROUTER_BASE_URL=https://openrouter.ai/api/v1,ALLOWED_ORIGINS=https://ltad-coach.vercel.app,FRONTEND_URL=https://ltad-coach.vercel.app" \
  --set-secrets "OPENROUTER_API_KEY=openrouter-key:latest,RESEND_API_KEY=resend-key:latest"
```

### Alternative: Deploy with environment variables (less secure):
```bash
gcloud run deploy ltad-coach-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300s \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "ENVIRONMENT=production,FIREBASE_STORAGE_BUCKET=ltad-coach.firebasestorage.app,OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY,OPENROUTER_BASE_URL=https://openrouter.ai/api/v1,RESEND_API_KEY=re_YOUR_KEY,ALLOWED_ORIGINS=https://ltad-coach.vercel.app,FRONTEND_URL=https://ltad-coach.vercel.app"
```

### What happens during deployment:
1. ✓ Uploads your code to Google Cloud Build
2. ✓ Reads your `Dockerfile`
3. ✓ Builds the container image
4. ✓ Pushes image to Artifact Registry
5. ✓ Deploys to Cloud Run
6. ✓ Returns your live URL

Expected output:
```
Building using Dockerfile and deploying container to Cloud Run service [ltad-coach-api]...
✓ Building and deploying... Done.
✓ Deploying...
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
Service [ltad-coach-api] revision [ltad-coach-api-00001-abc] has been deployed.
Service URL: https://ltad-coach-api-123abc-uc.a.run.app
```

**Copy this Service URL** - you'll need it for the frontend!

## Step 5: Test the Deployment

### Check health endpoint:
```bash
# Replace with your actual Cloud Run URL
curl https://ltad-coach-api-123abc-uc.a.run.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-10T22:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### Check API docs:
Open in browser: `https://ltad-coach-api-123abc-uc.a.run.app/docs`

You should see the FastAPI interactive documentation.

### Check logs:
```bash
gcloud run logs read ltad-coach-api --region us-central1 --limit 50
```

Look for:
- ✓ Firebase Admin SDK initialized
- ✓ Environment: production
- ✓ CORS Origins: [your-frontend-url]

## Step 6: Update Frontend Configuration

### Update your frontend `.env` file:

**Local development** (`client/.env`):
```bash
# Keep this for local development
VITE_API_URL=http://localhost:8000

# Add production URL
VITE_API_PRODUCTION_URL=https://ltad-coach-api-123abc-uc.a.run.app
```

### Update Vercel environment variables:

1. Go to: https://vercel.com/dashboard
2. Select your project: `ltad-coach`
3. Go to: **Settings** → **Environment Variables**
4. Update or add:
   - `VITE_API_URL` = `https://ltad-coach-api-123abc-uc.a.run.app`
   - OR `VITE_API_PRODUCTION_URL` = `https://ltad-coach-api-123abc-uc.a.run.app`
5. Redeploy your frontend

## Step 7: Update CORS Settings

Update the Cloud Run environment variable to include your Vercel URL:

```bash
gcloud run services update ltad-coach-api \
  --region us-central1 \
  --update-env-vars "ALLOWED_ORIGINS=https://ltad-coach.vercel.app,https://your-custom-domain.com"
```

## Deployment Configuration Explained

### Memory and CPU:
- `--memory 2Gi`: 2GB RAM (needed for MediaPipe + OpenCV video processing)
- `--cpu 2`: 2 vCPUs (for faster video processing)

### Scaling:
- `--min-instances 0`: Scales down to zero when not in use (saves money)
- `--max-instances 10`: Can scale up to 10 concurrent instances if needed

### Timeout:
- `--timeout 300s`: 5 minutes max request time (for video processing)

### Cost implications:
- With `min-instances 0`, you only pay when processing requests
- Typical cost: $1-5/month for development, $10-30/month with moderate traffic

## Future Deployments (After Code Changes)

Just run the deploy command again from the backend directory:

```bash
cd backend
gcloud run deploy ltad-coach-api --source .
```

Cloud Run will:
1. Rebuild the container with your new code
2. Deploy the new version
3. Automatically route traffic to the new version
4. Keep the same URL

## Monitoring and Debugging

### View logs in real-time:
```bash
gcloud run logs tail ltad-coach-api --region us-central1
```

### View recent logs:
```bash
gcloud run logs read ltad-coach-api --region us-central1 --limit 100
```

### Check service status:
```bash
gcloud run services describe ltad-coach-api --region us-central1
```

### View metrics in Cloud Console:
https://console.cloud.google.com/run?project=ltad-coach

You can see:
- Request count
- Request latency
- Error rate
- Instance count
- Memory/CPU usage

## Troubleshooting

### Build fails with "permission denied":
```bash
# Make sure you're authenticated
gcloud auth login

# Make sure APIs are enabled
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### Container fails to start:
```bash
# Check logs for errors
gcloud run logs read ltad-coach-api --region us-central1 --limit 50

# Common issues:
# - Missing environment variables
# - Firebase initialization failed
# - Port binding error (should use PORT env var)
```

### Firebase connection fails:
```bash
# Make sure your Cloud Run service account has Firebase permissions
gcloud projects add-iam-policy-binding ltad-coach \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

### CORS errors from frontend:
```bash
# Update ALLOWED_ORIGINS to include your frontend URL
gcloud run services update ltad-coach-api \
  --region us-central1 \
  --update-env-vars "ALLOWED_ORIGINS=https://ltad-coach.vercel.app"
```

## Cost Optimization

### Current configuration cost estimate:
- **Free tier**: 2 million requests/month, 360,000 GB-seconds/month
- **After free tier**: ~$0.00002 per request, ~$0.0000025 per GB-second

### For development (low traffic):
- Expected: $0-2/month (likely stays in free tier)

### For production (moderate traffic):
- 1,000 requests/day: ~$1-3/month
- 10,000 requests/day: ~$10-30/month

### Tips to reduce costs:
1. Keep `min-instances 0` during development
2. Reduce memory to 1Gi if video processing works fine
3. Reduce timeout if videos process faster than 5 minutes
4. Use caching for frequently accessed data

## Comparison: Heroku vs Cloud Run

| Feature | Heroku | Cloud Run |
|---------|--------|-----------|
| **Minimum cost** | $7/month (always running) | $0/month (scales to zero) |
| **Auto-scaling** | Manual/paid | Automatic/free |
| **Firebase integration** | Requires service account JSON | Automatic (ADC) |
| **Container support** | Via Dockerfile | Native |
| **Max memory** | 512MB (basic) | Up to 32GB |
| **Max timeout** | 30s (free), 60s (paid) | Up to 60 minutes |
| **Deployment** | Git push or CLI | gcloud CLI |

## Next Steps

1. ✓ Deploy backend to Cloud Run
2. ✓ Get Cloud Run URL
3. ✓ Update frontend environment variables
4. ✓ Redeploy frontend on Vercel
5. ✓ Test end-to-end flow
6. ✓ Monitor logs and performance

## Getting Help

- Cloud Run documentation: https://cloud.google.com/run/docs
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Stack Overflow: Tag with `google-cloud-run` and `firebase-admin`

## Summary

You now have:
- ✓ FastAPI backend running on Cloud Run
- ✓ Automatic Firebase authentication (no JSON files needed)
- ✓ Auto-scaling (0 to 1000+ instances)
- ✓ Pay-per-use pricing (much cheaper than always-on)
- ✓ Same Google Cloud ecosystem as Firebase
- ✓ Production-ready deployment

Your app is fully deployed and accessible from anywhere! 🚀
