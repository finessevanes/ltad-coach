---
id: FE-005
depends_on: [FE-001]
blocks: [FE-007, FE-011, FE-012, FE-020, FE-021, FE-024]
---

# FE-005: API Client Service

## Scope

**In Scope:**
- Axios-based API client
- Automatic auth token inclusion
- Base URL configuration
- Error handling

**Out of Scope:**
- Specific API endpoints (handled per feature)

## Technical Decisions

- **Library**: Axios
- **Base URL**: From environment variable
- **Auth**: Automatic Bearer token from Firebase
- **Interceptors**: Request (add token), Response (handle errors)
- **Location**: `src/services/api.js`

## Acceptance Criteria

- [ ] Axios configured with base URL
- [ ] Auth token automatically included
- [ ] Request/response interceptors work
- [ ] Error responses handled consistently

## Files to Create/Modify

- `src/services/api.js` (create)
- `.env.example` (modify - add API_URL)

## Implementation Notes

**Install Axios**:
```bash
npm install axios
```

**src/services/api.js**:
```javascript
import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.detail || error.response.data?.error || error.message;
      console.error('API Error:', message);
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('Network error - please check your connection'));
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default api;

// Convenience methods
export const apiClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
};
```

## Testing

Test in any component:
```javascript
import api from '../services/api';

// This will automatically include auth token
const response = await api.get('/api/auth/me');
console.log(response.data);
```

## Estimated Complexity

**Size**: S (Small - ~1 hour)
