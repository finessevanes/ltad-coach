# LTAD Coach - Client Application

A modern, responsive React application for the LTAD (Long-Term Athlete Development) Coach Balance Assessment Platform.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Auth**: Firebase Authentication
- **API**: Axios with interceptors
- **State Management**: React Context

## Project Structure

```
client/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout/       # Layout components (AppLayout, Navigation)
│   │   ├── ErrorBoundary.jsx
│   │   ├── Loading.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/            # Page components
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── DashboardPage.jsx
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/            # Custom hooks
│   │   └── useAuth.js
│   ├── services/         # API and Firebase services
│   │   ├── firebase.js
│   │   └── api.js
│   ├── utils/            # Helper functions
│   │   ├── routes.js
│   │   └── validation.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env                  # Environment variables (DO NOT COMMIT)
├── .env.example          # Example environment variables
├── package.json
├── vite.config.js
└── index.html
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env` file

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:component` - Run component tests

## Environment Variables

See `.env` file for all configuration. Key variables:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_API_URL` - Backend API URL (development)
- `VITE_API_PRODUCTION_URL` - Backend API URL (production)

## Features Implemented

### Core Infrastructure
- ✅ React project setup with Vite
- ✅ Material-UI v5 configuration with custom theme
- ✅ React Router setup
- ✅ Firebase client SDK
- ✅ API client with auth interceptors
- ✅ Error boundaries
- ✅ Loading states
- ✅ Toast notifications
- ✅ Form validation helpers
- ✅ Comprehensive test setup (Vitest + Playwright)

### Authentication
- ✅ Auth context provider
- ✅ Login page (email/password + Google)
- ✅ Register page (email/password + Google)
- ✅ Protected routes
- ✅ Auto-redirect on auth state

### Assessment Features (PR-021, PR-022, PR-023)
- ✅ Assessment Results Display
  - Comprehensive metrics cards
  - Score badges with color coding
  - Team ranking and peer comparison
  - AI feedback display
  - Coach notes editor
- ✅ Assessment History List
  - Sortable table/list view
  - Summary statistics
  - Mobile and desktop layouts
- ✅ Progress Charts
  - Interactive Recharts visualizations
  - Duration and stability trends
  - Trend analysis

### Parent Reports (PR-024, PR-025, PR-026)
- ✅ Report Preview UI
  - Professional formatting
  - Assessment summaries
  - Recommendations display
- ✅ Report Send Confirmation
  - Email validation
  - PIN generation and display
  - Success notifications
- ✅ Public Parent Report View
  - Secure PIN entry
  - Report viewing without authentication
  - Mobile-friendly layout

### User Interface (PR-027, PR-030)
- ✅ Settings Page
  - Account information
  - Logout functionality
- ✅ Responsive Layout Polish
  - Mobile-first design (375px+)
  - Tablet optimization (768px+)
  - Desktop layout (1024px+)
  - Smooth animations and transitions

### Testing (PR-032, PR-033)
- ✅ API Integration Tests with MSW
- ✅ Component Tests with Playwright
- ✅ Test fixtures and utilities

## Routing

All routes are defined in `src/utils/routes.js`:

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/register` - Register page

### Protected Routes
- `/dashboard` - Coach dashboard
- `/athletes` - Athletes list
- `/settings` - Settings page

## Authentication Flow

1. User registers or logs in via Firebase Auth
2. On successful auth, backend user is created via `/api/auth/token`
3. Auth state is managed globally via AuthContext
4. Protected routes check for currentUser before rendering
5. API client automatically includes Firebase ID token in requests

## Deployment

### Live URL
- **Production**: https://ltad-coach.vercel.app
- **Preview**: Auto-generated for each PR

### Vercel Deployment Setup

This application is configured for automatic deployment on Vercel.

#### First-Time Setup

1. **Connect GitHub Repository**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `client` directory as root directory

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Root Directory: `client`
   - Node Version: 18.x

3. **Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:

   ```
   VITE_FIREBASE_API_KEY=<your-firebase-api-key>
   VITE_FIREBASE_AUTH_DOMAIN=ltad-coach.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ltad-coach
   VITE_FIREBASE_STORAGE_BUCKET=ltad-coach.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
   VITE_FIREBASE_APP_ID=<app-id>
   VITE_API_URL=http://localhost:8000
   VITE_API_PRODUCTION_URL=https://ltad-coach-api.herokuapp.com
   ```

   **Important**: Add these for all environments (Production, Preview, Development)

4. **Configure Git Integration**
   - Production Branch: `main`
   - Automatically deploy commits: Enabled
   - Deploy Previews: Enabled for all branches

#### Manual Deployment

Install Vercel CLI (optional for local testing):
```bash
npm install -g vercel
```

Deploy manually:
```bash
npm run build
vercel --prod
```

#### Local Build Testing

Test the production build locally:
```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to see the production build.

### Health Check

The application includes a health check endpoint:
- URL: `https://ltad-coach.vercel.app/health.json`
- Should return: `{"status": "ok", "version": "1.0.0"}`

### Deployment Verification

After deployment, verify:
- [ ] App loads without errors
- [ ] Console shows no errors
- [ ] Firebase connection works (check Network tab)
- [ ] Routing works (navigate to `/login`, `/register`, `/dashboard`)
- [ ] API calls work (once backend is deployed)

### Preview Deployments

Preview deployments are automatically created for pull requests:
1. Create a new branch
2. Make changes and push
3. Create a pull request
4. Vercel bot comments with preview URL
5. Click preview URL to test changes

### Troubleshooting

**Build Fails**
- Check Vercel Dashboard build logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

**App Loads but Shows Errors**
- Check browser console for errors
- Verify Firebase environment variables
- Check API URL configuration
- Verify CORS settings (backend)

**Routing Issues (404 on refresh)**
- The `vercel.json` rewrite rule handles this
- All routes redirect to `/index.html` for client-side routing

## Development Notes

- Material-UI theme is configured in `App.jsx`
- All forms use validation helpers from `utils/validation.js`
- Error handling is done via ErrorBoundary and NotificationContext
- Loading states use the reusable `Loading` component

## Completed PRDs

All assessment display, reports, testing, and UI polish PRDs have been completed:

- ✅ PR-021: Assessment Results Display
- ✅ PR-022: Assessment History List
- ✅ PR-023: Progress Chart
- ✅ PR-024: Report Preview UI
- ✅ PR-025: Report Send Confirmation
- ✅ PR-026: Parent Report View
- ✅ PR-027: Settings Page
- ✅ PR-030: Responsive Layout Polish
- ✅ PR-032: Component Tests
- ✅ PR-033: API Integration Tests

## Key Implementation Highlights

### Responsive Design
All components use Material-UI's breakpoint system with mobile-first approach:
- Typography scales responsively
- Layouts adapt from single-column (mobile) to multi-column (desktop)
- Touch-friendly tap targets on mobile
- Optimized spacing for all screen sizes

### Data Visualization
Progress charts use Recharts with:
- Smooth area charts with gradients
- Interactive tooltips
- Switchable metrics (duration/stability)
- Trend analysis indicators
- Responsive sizing

### Security Features
Parent report viewing includes:
- 4-digit PIN verification
- Numeric-only input validation
- Secure API endpoints
- No authentication requirement for parents

### Testing Coverage
Comprehensive test suite includes:
- API integration tests with MSW mocking
- Component tests with Playwright
- Form validation tests
- User interaction tests
- Responsive layout tests
