---
id: FE-031
depends_on: [FE-001]
blocks: []
priority: HIGH
execute_early: true
---

# FE-031: Vercel Deployment Setup

## Scope

**In Scope:**
- Vercel project configuration
- Environment variables setup
- Automatic deployment on git push
- Preview deployments for pull requests
- Custom domain setup (optional for MVP)

**Out of Scope:**
- Backend deployment (BE-041)
- CDN configuration
- Advanced caching strategies

## Technical Decisions

- **Platform**: Vercel (optimized for React/Vite)
- **Deploy Trigger**: Auto-deploy on push to `main` branch
- **PR Previews**: Enabled for all pull requests
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x

## Acceptance Criteria

- [ ] Vercel project connected to GitHub repo
- [ ] Auto-deployment works on push to `main`
- [ ] Preview URLs generated for PRs
- [ ] Environment variables configured
- [ ] Build succeeds in Vercel
- [ ] Live URL accessible (e.g., `https://ltad-coach.vercel.app`)
- [ ] Health check endpoint returns 200

## Files to Create

- `client/vercel.json`
- `.github/workflows/vercel-preview.yml` (optional - Vercel does this automatically)
- Update `client/README.md` with deployment info

## Implementation Notes

### Step 1: Install Vercel CLI (Optional for local testing)

```bash
npm install -g vercel
```

### Step 2: Create vercel.json

**client/vercel.json**:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_FIREBASE_API_KEY": "@vite_firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@vite_firebase_auth_domain",
    "VITE_FIREBASE_PROJECT_ID": "@vite_firebase_project_id",
    "VITE_FIREBASE_STORAGE_BUCKET": "@vite_firebase_storage_bucket",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "@vite_firebase_messaging_sender_id",
    "VITE_FIREBASE_APP_ID": "@vite_firebase_app_id",
    "VITE_API_URL": "@vite_api_url"
  },
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Step 3: Vercel Dashboard Setup

1. **Connect GitHub Repository**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `client` directory as root

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Root Directory: `client`

3. **Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:

   ```
   VITE_FIREBASE_API_KEY=<your-firebase-api-key>
   VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
   VITE_FIREBASE_APP_ID=<app-id>
   VITE_API_URL=https://your-backend.herokuapp.com
   ```

   **Important**: Add these for all environments (Production, Preview, Development)

### Step 4: Configure Deployment Settings

**Vercel Dashboard → Settings → Git**:
- Production Branch: `main`
- Automatically deploy commits: ✅ Enabled
- Deploy Previews: ✅ Enabled for all branches

### Step 5: Update package.json (if needed)

Ensure your `client/package.json` has the correct scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Step 6: Create .vercelignore (optional)

**client/.vercelignore**:
```
node_modules
.env
.env.local
*.log
.DS_Store
```

### Step 7: Add Health Check Route (Optional)

**client/public/health.json**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "{{timestamp}}"
}
```

Access via: `https://ltad-coach.vercel.app/health.json`

### Step 8: Update README

**client/README.md** - Add deployment section:

```markdown
## Deployment

### Live URL
- **Production**: https://ltad-coach.vercel.app
- **Preview**: Auto-generated for each PR

### Deploy Manually
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Environment Variables
Required environment variables (set in Vercel Dashboard):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_API_URL`
```

## Testing

### Local Build Test

```bash
cd client
npm run build
npm run preview
```

Visit `http://localhost:4173` - should see the production build

### Verify Deployment

1. Push to `main` branch
2. Check Vercel Dashboard for build logs
3. Visit production URL
4. Verify:
   - [ ] App loads without errors
   - [ ] Console shows no errors
   - [ ] Firebase connection works (check Network tab)
   - [ ] Routing works (navigate to `/login`, `/register`)

### Test Preview Deployment

1. Create a new branch
2. Make a small change
3. Push and create PR
4. Vercel bot comments with preview URL
5. Click preview URL and verify changes

## Troubleshooting

### Build Fails

**Check build logs in Vercel Dashboard**:
- Ensure `package.json` dependencies are correct
- Check for TypeScript errors (if using TS)
- Verify environment variables are set

### App Loads but Shows Errors

**Check browser console**:
- Missing environment variables (Firebase config)
- API URL incorrect or backend not deployed
- CORS issues (will be resolved in BE-041 + BE-038)

### Routing Issues (404 on refresh)

**Ensure `vercel.json` has the rewrite rule**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Estimated Complexity

**Size**: S (Small - ~30 minutes)

## Notes

- **Execute this PR early** - Having a live deployment URL from the start enables:
  - Continuous integration testing
  - Stakeholder demos
  - Mobile device testing
  - Sharing progress with team/investors
- Vercel automatically handles HTTPS, CDN, and global deployment
- Preview deployments are perfect for PR reviews
- Free tier supports unlimited deployments for hobby projects
- Can add custom domain later via Vercel Dashboard → Settings → Domains

## Post-Deployment Checklist

- [ ] Share production URL with team
- [ ] Test on mobile devices
- [ ] Verify Firebase connection works in production
- [ ] Add URL to project documentation
- [ ] Set up status monitoring (optional: UptimeRobot, Vercel Analytics)
