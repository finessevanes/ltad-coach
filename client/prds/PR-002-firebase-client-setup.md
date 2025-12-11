---
id: FE-002
depends_on: [FE-001]
blocks: [FE-004, FE-015, FE-026]
---

# FE-002: Firebase Client SDK Configuration

## Scope

**In Scope:**
- Install Firebase SDK
- Initialize Firebase app
- Configure Auth and Firestore
- Environment variables for Firebase config

**Out of Scope:**
- Auth context/hooks (FE-004)
- Firestore queries (handled per feature)

## Technical Decisions

- **SDK**: Firebase JavaScript SDK v10
- **Services**: Auth, Firestore, Storage
- **Config**: Environment variables (.env)
- **Initialization**: Singleton pattern
- **Location**: `src/services/firebase.js`

## Acceptance Criteria

- [ ] Firebase SDK installed
- [ ] Firebase app initializes successfully
- [ ] Auth, Firestore, Storage instances exported
- [ ] Config loaded from .env
- [ ] No credentials committed

## Files to Create/Modify

- `src/services/firebase.js` (create)
- `.env.example` (create)
- `.env.local` (create - not committed)
- `.gitignore` (modify - ensure .env.local excluded)

## Implementation Notes

**Install Firebase**:
```bash
npm install firebase
```

**src/services/firebase.js**:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

**.env.example**:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:8000
```

## Testing

Add to `App.jsx`:
```javascript
import { auth } from './services/firebase';

console.log('Firebase initialized:', auth.app.name);
```

Check console for confirmation.

## Estimated Complexity

**Size**: S (Small - ~1 hour)

## Notes

- Firebase config is public (safe to include in frontend)
- Get config from Firebase Console > Project Settings
- Security enforced via Firebase Security Rules, not config hiding
