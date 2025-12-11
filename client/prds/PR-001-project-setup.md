COMPLETED

---
id: FE-001
depends_on: []
blocks: [FE-002, FE-003, FE-004, FE-005, FE-028, FE-029, FE-030]
---

# FE-001: React Project Setup

## Scope

**In Scope:**
- Initialize React project with Vite
- Configure Material-UI
- Set up project structure
- Basic routing setup

**Out of Scope:**
- Firebase integration (FE-002)
- Authentication (FE-004)
- API client (FE-005)

## Technical Decisions

- **Build Tool**: Vite (faster than CRA)
- **Framework**: React 18
- **UI Library**: Material-UI (MUI) v5
- **Styling**: MUI's sx prop + styled-components
- **TypeScript**: Optional (JavaScript for faster MVP)
- **Project Structure**:
  ```
  client/
  ├── src/
  │   ├── components/     # Reusable components
  │   ├── pages/          # Page components
  │   ├── services/       # API, Firebase
  │   ├── contexts/       # React contexts
  │   ├── hooks/          # Custom hooks
  │   ├── utils/          # Helpers
  │   ├── App.jsx
  │   └── main.jsx
  ├── public/
  ├── package.json
  └── vite.config.js
  ```

## Acceptance Criteria

- [ ] Vite project initializes successfully
- [ ] Material-UI installed and working
- [ ] Dev server runs on `http://localhost:3000` or `5173`
- [ ] Basic app component renders
- [ ] Clean, organized folder structure
- [ ] README with setup instructions

## Files to Create

- `package.json`
- `vite.config.js`
- `src/main.jsx`
- `src/App.jsx`
- `index.html`
- `.gitignore`
- `README.md`

## Implementation Notes

**Initialize project**:
```bash
npm create vite@latest client -- --template react
cd client
npm install
```

**Install Material-UI**:
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

**src/App.jsx**:
```jsx
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Container, Typography } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <Typography variant="h3" sx={{ my: 4 }}>
          AI Coach
        </Typography>
        <Typography>
          Athletic assessment platform for youth sports
        </Typography>
      </Container>
    </ThemeProvider>
  );
}

export default App;
```

**package.json** (key dependencies):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@mui/material": "^5.14.20",
    "@mui/icons-material": "^5.14.19",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

## Testing

```bash
npm run dev
```

Visit `http://localhost:5173` - should see "AI Coach" heading

## Estimated Complexity

**Size**: S (Small - ~1-2 hours)
