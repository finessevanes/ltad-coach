---
id: BE-039
depends_on: [BE-029, FE-019, FE-021]
blocks: []
---

# BE-039: Playwright E2E Testing Setup

## Scope

**In Scope:**
- Install and configure Playwright
- Set up test environment (backend + frontend)
- Create camera/video mocking utilities
- Write E2E test for critical path (login → assess → results)
- CI/CD integration configuration

**Out of Scope:**
- Component-level tests (FE-032)
- Unit tests for individual endpoints
- Load/performance testing

## Technical Decisions

- **Framework**: Playwright (cross-browser support)
- **Language**: TypeScript for type safety
- **Test Environment**:
  - Backend runs on `localhost:8000`
  - Frontend runs on `localhost:5173`
  - Separate test database/Firebase project
- **Video Mocking**: Use Playwright's video capture API + fake MediaStream
- **Location**: `tests/e2e/` directory at root

## Acceptance Criteria

- [ ] Playwright installed and configured
- [ ] Test database/Firebase project set up
- [ ] Camera mocking utility works
- [ ] E2E test for full assessment flow passes
- [ ] Test runs in headless mode
- [ ] CI configuration provided (GitHub Actions example)
- [ ] Test data seeding script created

## Files to Create

- `tests/e2e/playwright.config.ts`
- `tests/e2e/setup/test-db-seed.ts`
- `tests/e2e/utils/camera-mock.ts`
- `tests/e2e/utils/test-helpers.ts`
- `tests/e2e/critical-path.spec.ts`
- `.github/workflows/e2e-tests.yml`
- `package.json` (modify - add test scripts)

## Implementation Notes

### Install Playwright

```bash
# At root of project
npm init playwright@latest
npm install -D @playwright/test
```

### tests/e2e/playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially for MVP
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Grant camera permissions by default
        permissions: ['camera', 'microphone'],
      },
    },
  ],

  webServer: [
    {
      command: 'cd backend && source venv/bin/activate && uvicorn app.main:app --port 8000',
      port: 8000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd client && npm run dev',
      port: 5173,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### tests/e2e/utils/camera-mock.ts

```typescript
import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class CameraMock {
  /**
   * Inject a fake video stream into the page
   * Uses a pre-recorded test video file
   */
  static async injectFakeVideoStream(page: Page, videoPath?: string) {
    // Use test video or create canvas-based fake stream
    const testVideoPath = videoPath || path.join(__dirname, '../fixtures/test-balance.mp4');

    await page.addInitScript(() => {
      // Override getUserMedia to return fake stream
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices
      );

      navigator.mediaDevices.getUserMedia = async (constraints) => {
        // Create a video element from our test file
        const video = document.createElement('video');
        video.src = '/test-fixtures/test-balance.mp4'; // Served by test server
        video.loop = true;
        video.muted = true;
        await video.play();

        // Capture stream from video element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 640;
        canvas.height = 480;

        // Draw video to canvas at 30fps
        const stream = canvas.captureStream(30);

        const drawLoop = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawLoop);
        };
        drawLoop();

        return stream;
      };
    });
  }

  /**
   * Grant camera permissions for Playwright context
   */
  static async grantCameraPermissions(page: Page) {
    await page.context().grantPermissions(['camera', 'microphone']);
  }
}
```

### tests/e2e/utils/test-helpers.ts

```typescript
import { Page, expect } from '@playwright/test';

export class TestHelpers {
  /**
   * Login as test coach
   */
  static async loginAsCoach(page: Page, email: string = 'test@coach.com', password: string = 'TestPass123!') {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  }

  /**
   * Create test athlete
   */
  static async createTestAthlete(page: Page, athleteData?: Partial<{
    name: string;
    age: number;
    gender: string;
    parentEmail: string;
  }>) {
    const data = {
      name: 'Test Athlete',
      age: 12,
      gender: 'male',
      parentEmail: 'parent@test.com',
      ...athleteData,
    };

    await page.goto('/athletes');
    await page.click('button:has-text("Add Athlete")');

    await page.fill('input[name="name"]', data.name);
    await page.fill('input[name="age"]', data.age.toString());
    await page.selectOption('select[name="gender"]', data.gender);
    await page.fill('input[name="parentEmail"]', data.parentEmail);

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/athletes\/*/);

    return data;
  }

  /**
   * Mock consent approval (bypass email flow)
   */
  static async approveConsentDirectly(page: Page, athleteId: string) {
    // Call backend directly to approve consent
    await page.request.post(`http://localhost:8000/api/consent/test-bypass`, {
      data: { athleteId },
    });
  }

  /**
   * Wait for video processing
   */
  static async waitForAssessmentProcessing(page: Page, timeout: number = 60000) {
    await page.waitForSelector('text=Analysis complete', { timeout });
  }
}
```

### tests/e2e/critical-path.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import { CameraMock } from './utils/camera-mock';
import { TestHelpers } from './utils/test-helpers';

test.describe('Critical Path: Full Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Grant permissions
    await CameraMock.grantCameraPermissions(page);

    // Inject fake video stream
    await CameraMock.injectFakeVideoStream(page);
  });

  test('Coach can complete full assessment workflow', async ({ page }) => {
    // 1. Login
    await TestHelpers.loginAsCoach(page);
    expect(page.url()).toContain('/dashboard');

    // 2. Create athlete
    const athlete = await TestHelpers.createTestAthlete(page, {
      name: 'E2E Test Athlete',
      age: 11,
    });

    // 3. Bypass consent (for testing)
    const athleteId = page.url().split('/').pop()!;
    await TestHelpers.approveConsentDirectly(page, athleteId);

    // Refresh to see active status
    await page.reload();
    await expect(page.locator('text=Active')).toBeVisible();

    // 4. Start new assessment
    await page.click('button:has-text("New Assessment")');

    // 5. Select test type and leg
    await page.click('text=One-Leg Balance Test');
    await page.click('text=Left Leg');
    await page.click('button:has-text("Continue")');

    // 6. Camera setup - verify preview appears
    await expect(page.locator('video')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('canvas')).toBeVisible(); // Skeleton overlay

    // 7. Start recording
    await page.click('button:has-text("Start Recording")');

    // 8. Wait for countdown
    await expect(page.locator('text=3')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible();

    // 9. Verify timer is running
    await expect(page.locator('text=20')).toBeVisible();

    // 10. Wait for recording to complete (or stop early)
    await page.waitForTimeout(3000); // Let it record for 3 seconds
    await page.click('button:has-text("Stop")');

    // 11. Preview recorded video
    await expect(page.locator('text=Preview')).toBeVisible();
    await expect(page.locator('video[controls]')).toBeVisible();

    // 12. Analyze
    await page.click('button:has-text("Analyze")');

    // 13. Wait for processing
    await page.waitForSelector('text=Processing', { timeout: 5000 });
    await TestHelpers.waitForAssessmentProcessing(page);

    // 14. Verify results page
    await expect(page.locator('text=Assessment Results')).toBeVisible();

    // 15. Verify metrics are displayed
    await expect(page.locator('text=Duration')).toBeVisible();
    await expect(page.locator('text=Stability Score')).toBeVisible();
    await expect(page.locator('text=AI Feedback')).toBeVisible();

    // 16. Verify score badge (1-5)
    const scoreBadge = page.locator('[data-testid="score-badge"]');
    await expect(scoreBadge).toBeVisible();
    const scoreText = await scoreBadge.textContent();
    expect(['1', '2', '3', '4', '5']).toContain(scoreText);

    // 17. Add coach notes
    await page.fill('textarea[name="coachNotes"]', 'E2E test - good form!');
    await page.click('button:has-text("Save Notes")');
    await expect(page.locator('text=Notes saved')).toBeVisible();

    // 18. Navigate back to athlete profile
    await page.click('text=Back to Athlete');

    // 19. Verify assessment appears in history
    await expect(page.locator('text=E2E Test Athlete')).toBeVisible();
    await expect(page.locator('[data-testid="assessment-list"]')).toContainText('One-Leg Balance');
  });

  test('Coach can view assessment history and generate report', async ({ page }) => {
    // Login and navigate to athlete with existing assessments
    await TestHelpers.loginAsCoach(page);

    // Assume athlete from previous test exists
    await page.goto('/athletes');
    await page.click('text=E2E Test Athlete');

    // Verify history is visible
    await expect(page.locator('[data-testid="assessment-list"]')).toBeVisible();

    // Generate parent report
    await page.click('button:has-text("Generate Report")');

    // Verify preview
    await expect(page.locator('text=Report Preview')).toBeVisible();
    await expect(page.locator('text=Progress Overview')).toBeVisible();

    // Send report
    await page.click('button:has-text("Send to Parent")');

    // Verify confirmation
    await expect(page.locator('text=Report sent successfully')).toBeVisible();
    await expect(page.locator('text=Access PIN:')).toBeVisible();
  });
});
```

### tests/e2e/setup/test-db-seed.ts

```typescript
/**
 * Seed test database with minimal data
 * Run before E2E tests
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

async function seedTestData() {
  // Initialize Firebase Admin (test project)
  const app = initializeApp({
    projectId: process.env.FIREBASE_TEST_PROJECT_ID,
  });

  const db = getFirestore(app);
  const auth = getAuth(app);

  // Create test coach user
  try {
    await auth.createUser({
      email: 'test@coach.com',
      password: 'TestPass123!',
      displayName: 'Test Coach',
    });
    console.log('✓ Test coach created');
  } catch (e) {
    console.log('Test coach already exists');
  }

  // Get coach UID
  const coach = await auth.getUserByEmail('test@coach.com');

  // Create coach document
  await db.collection('users').doc(coach.uid).set({
    email: 'test@coach.com',
    name: 'Test Coach',
    athleteCount: 0,
  });

  // Seed benchmark data (reuse from BE-020)
  const benchmarks = [
    {
      testType: 'one_leg_balance',
      ageGroup: '10-11',
      expectedScore: 4,
      scoringTiers: {
        score1: { min: 1, max: 9, label: 'Beginning' },
        score2: { min: 10, max: 14, label: 'Developing' },
        score3: { min: 15, max: 19, label: 'Competent' },
        score4: { min: 20, max: 24, label: 'Proficient' },
        score5: { min: 25, max: null, label: 'Advanced' },
      },
    },
  ];

  for (const benchmark of benchmarks) {
    const docId = `${benchmark.testType}_${benchmark.ageGroup}`;
    await db.collection('benchmarks').doc(docId).set(benchmark);
  }

  console.log('✓ Test database seeded');
  process.exit(0);
}

seedTestData().catch(console.error);
```

### .github/workflows/e2e-tests.yml

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e-tests:
    timeout-minutes: 15
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install backend dependencies
        run: |
          cd backend
          python -m venv venv
          source venv/bin/activate
          pip install -r requirements.txt

      - name: Install frontend dependencies
        run: |
          cd client
          npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Seed test database
        env:
          FIREBASE_TEST_PROJECT_ID: ${{ secrets.FIREBASE_TEST_PROJECT_ID }}
        run: |
          npm run test:seed

      - name: Run E2E tests
        env:
          FIREBASE_TEST_PROJECT_ID: ${{ secrets.FIREBASE_TEST_PROJECT_ID }}
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_TEST_API_KEY }}
        run: |
          npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### package.json (add scripts)

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:seed": "ts-node tests/e2e/setup/test-db-seed.ts"
  }
}
```

## Testing

### Local Testing

```bash
# 1. Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Start frontend (separate terminal)
cd client
npm run dev

# 3. Seed test database (separate terminal)
npm run test:seed

# 4. Run tests
npm run test:e2e

# Or with UI
npm run test:e2e:ui
```

### Verify

- [ ] Test creates athlete
- [ ] Test records video (mocked)
- [ ] Test completes analysis
- [ ] Test displays results
- [ ] All assertions pass

## Estimated Complexity

**Size**: L (Large - ~4-5 hours)

## Notes

- Test video fixture required (`test-balance.mp4`)
- Separate Firebase test project recommended
- Tests modify database - use test environment only
- CI requires Firebase test credentials as secrets
- Consider test isolation/cleanup between runs
