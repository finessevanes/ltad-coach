---
id: FE-032
depends_on: [FE-017, FE-018, FE-021]
blocks: []
---

# FE-032: Component Tests with Playwright

## Scope

**In Scope:**
- Component tests for critical UI elements
- MediaPipe skeleton overlay tests
- Video recording flow component tests
- Assessment results display tests
- Form validation tests

**Out of Scope:**
- E2E tests (BE-039)
- Unit tests for utilities
- API integration tests (FE-033)

## Technical Decisions

- **Framework**: Playwright Component Testing
- **Test Location**: `client/src/components/**/*.spec.tsx`
- **Fixtures**: Mock data and video streams
- **Coverage**: Critical user-facing components only
- **Pattern**: Arrange-Act-Assert

## Acceptance Criteria

- [ ] Playwright component testing configured
- [ ] Skeleton overlay renders correctly
- [ ] Countdown timer component tested
- [ ] Video player component tested
- [ ] Assessment results cards tested
- [ ] Form components tested
- [ ] All tests pass in CI

## Files to Create

- `client/playwright-ct.config.ts`
- `client/src/components/Assessment/SkeletonOverlay.spec.tsx`
- `client/src/components/Assessment/CountdownTimer.spec.tsx`
- `client/src/components/Assessment/VideoPlayer.spec.tsx`
- `client/src/components/Assessment/MetricsCard.spec.tsx`
- `client/src/components/Athletes/AthleteForm.spec.tsx`
- `client/src/test-utils/fixtures.ts`

## Implementation Notes

### Install Playwright Component Testing

```bash
cd client
npm install -D @playwright/experimental-ct-react
```

### client/playwright-ct.config.ts

```typescript
import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.spec.tsx',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### client/src/test-utils/fixtures.ts

```typescript
/**
 * Mock data for component tests
 */

export const mockAthleteData = {
  id: 'test-athlete-1',
  name: 'Test Athlete',
  age: 12,
  gender: 'male',
  parentEmail: 'parent@test.com',
  consentStatus: 'active',
  coachId: 'test-coach-1',
};

export const mockAssessmentData = {
  id: 'test-assessment-1',
  athleteId: 'test-athlete-1',
  testType: 'one_leg_balance',
  legTested: 'left',
  createdAt: '2025-12-10T10:00:00Z',
  metrics: {
    durationSeconds: 18.5,
    stabilityScore: 75,
    swayVelocity: 8.2,
    swayStdX: 0.045,
    swayStdY: 0.032,
    swayPathLength: 152,
    armExcursionLeft: 0.12,
    armExcursionRight: 0.15,
    armAsymmetryRatio: 0.8,
    correctionsCount: 3,
    failureReason: 'foot_touchdown',
    durationScore: {
      score: 3,
      label: 'Competent',
      expectationStatus: 'below',
      expectedScore: 4,
    },
    percentile: 62,
  },
  aiFeedback: 'Good balance control for age 12. Work on reducing arm compensation.',
  percentile: 62,
};

export const mockTeamRank = {
  rank: 4,
  totalAthletes: 12,
  percentile: 67,
};

/**
 * Create mock MediaStream for video testing
 */
export function createMockVideoStream(): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  // Draw test pattern
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = 'white';
  ctx.fillText('Test Video', 300, 240);

  return canvas.captureStream(30);
}

/**
 * Mock MediaPipe pose results
 */
export const mockPoseLandmarks = {
  poseLandmarks: Array.from({ length: 33 }, (_, i) => ({
    x: 0.5 + Math.random() * 0.1,
    y: 0.5 + Math.random() * 0.1,
    z: 0,
    visibility: 0.9,
  })),
};
```

### client/src/components/Assessment/SkeletonOverlay.spec.tsx

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import SkeletonOverlay from './SkeletonOverlay';
import { mockPoseLandmarks, createMockVideoStream } from '../../test-utils/fixtures';

test.describe('SkeletonOverlay', () => {
  test('renders canvas overlay', async ({ mount }) => {
    const component = await mount(
      <SkeletonOverlay
        videoRef={{ current: document.createElement('video') }}
        isActive={true}
      />
    );

    const canvas = component.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('draws skeleton when pose detected', async ({ mount, page }) => {
    const videoElement = document.createElement('video');
    videoElement.srcObject = createMockVideoStream();
    await videoElement.play();

    const component = await mount(
      <SkeletonOverlay
        videoRef={{ current: videoElement }}
        isActive={true}
      />
    );

    // Wait for MediaPipe to initialize
    await page.waitForTimeout(2000);

    // Canvas should have drawn content
    const canvas = component.locator('canvas');
    const canvasElement = await canvas.elementHandle();

    // Check canvas is not blank (has been drawn to)
    const hasContent = await page.evaluate((el) => {
      const ctx = (el as HTMLCanvasElement).getContext('2d');
      const imageData = ctx!.getImageData(0, 0, el.width, el.height);
      return imageData.data.some(pixel => pixel !== 0);
    }, canvasElement);

    expect(hasContent).toBe(true);
  });

  test('stops drawing when isActive is false', async ({ mount }) => {
    const component = await mount(
      <SkeletonOverlay
        videoRef={{ current: document.createElement('video') }}
        isActive={false}
      />
    );

    // Canvas should exist but not be actively drawing
    const canvas = component.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify no animation loop is running
    // (implementation-specific check)
  });
});
```

### client/src/components/Assessment/CountdownTimer.spec.tsx

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import CountdownTimer from './CountdownTimer';
import { useState } from 'react';

test.describe('CountdownTimer', () => {
  test('displays initial countdown value', async ({ mount }) => {
    const component = await mount(
      <CountdownTimer initialSeconds={20} onComplete={() => {}} />
    );

    await expect(component.locator('text=20')).toBeVisible();
  });

  test('counts down every second', async ({ mount, page }) => {
    const component = await mount(
      <CountdownTimer initialSeconds={5} onComplete={() => {}} />
    );

    await expect(component.locator('text=5')).toBeVisible();
    await page.waitForTimeout(1100);
    await expect(component.locator('text=4')).toBeVisible();
    await page.waitForTimeout(1100);
    await expect(component.locator('text=3')).toBeVisible();
  });

  test('calls onComplete when reaches zero', async ({ mount, page }) => {
    let completed = false;

    const component = await mount(
      <CountdownTimer
        initialSeconds={2}
        onComplete={() => { completed = true; }}
      />
    );

    await page.waitForTimeout(2500);
    expect(completed).toBe(true);
  });

  test('displays different styles for warning threshold', async ({ mount }) => {
    const component = await mount(
      <CountdownTimer
        initialSeconds={5}
        warningThreshold={3}
        onComplete={() => {}}
      />
    );

    // Should not have warning class initially
    let timer = component.locator('[data-testid="timer"]');
    await expect(timer).not.toHaveClass(/warning/);

    // Wait until warning threshold
    await component.locator('text=3').waitFor();

    // Should now have warning class
    timer = component.locator('[data-testid="timer"]');
    await expect(timer).toHaveClass(/warning/);
  });
});
```

### client/src/components/Assessment/VideoPlayer.spec.tsx

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import VideoPlayer from './VideoPlayer';

test.describe('VideoPlayer', () => {
  test('renders video element with controls', async ({ mount }) => {
    const mockBlob = new Blob(['fake video'], { type: 'video/mp4' });
    const videoUrl = URL.createObjectURL(mockBlob);

    const component = await mount(
      <VideoPlayer videoUrl={videoUrl} />
    );

    const video = component.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('controls', '');
  });

  test('displays video duration when loaded', async ({ mount, page }) => {
    const component = await mount(
      <VideoPlayer videoUrl="/test-fixtures/test-video.mp4" />
    );

    // Wait for metadata to load
    await page.waitForSelector('[data-testid="duration"]');

    const duration = component.locator('[data-testid="duration"]');
    await expect(duration).toContainText(/\d+:\d+/); // MM:SS format
  });

  test('play and pause controls work', async ({ mount, page }) => {
    const component = await mount(
      <VideoPlayer videoUrl="/test-fixtures/test-video.mp4" />
    );

    const playButton = component.locator('button:has-text("Play")');
    await playButton.click();

    // Video should start playing
    const video = component.locator('video');
    const isPlaying = await page.evaluate((el) => {
      return !(el as HTMLVideoElement).paused;
    }, await video.elementHandle());

    expect(isPlaying).toBe(true);

    // Pause
    const pauseButton = component.locator('button:has-text("Pause")');
    await pauseButton.click();

    const isPaused = await page.evaluate((el) => {
      return (el as HTMLVideoElement).paused;
    }, await video.elementHandle());

    expect(isPaused).toBe(true);
  });
});
```

### client/src/components/Assessment/MetricsCard.spec.tsx

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import MetricsCard from './MetricsCard';
import { mockAssessmentData } from '../../test-utils/fixtures';

test.describe('MetricsCard', () => {
  test('displays all key metrics', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={mockAssessmentData.metrics} />
    );

    // Verify duration displayed
    await expect(component.locator('text=18.5')).toBeVisible();

    // Verify stability score
    await expect(component.locator('text=75')).toBeVisible();

    // Verify score badge
    await expect(component.locator('text=3')).toBeVisible(); // Score
    await expect(component.locator('text=Competent')).toBeVisible(); // Label
  });

  test('score badge has correct color based on value', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={{
        ...mockAssessmentData.metrics,
        durationScore: { score: 5, label: 'Advanced' },
      }} />
    );

    const badge = component.locator('[data-testid="score-badge"]');
    await expect(badge).toHaveClass(/success/); // Score 5 should be green/success
  });

  test('displays expectation status correctly', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={mockAssessmentData.metrics} />
    );

    // Should show "below expected" since expectationStatus is 'below'
    await expect(component.locator('text=/below/i')).toBeVisible();
  });

  test('quality metrics section is expandable', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={mockAssessmentData.metrics} />
    );

    // Quality details should be hidden initially
    await expect(component.locator('text=Sway Velocity')).not.toBeVisible();

    // Click expand button
    await component.locator('button:has-text("View Details")').click();

    // Quality details should now be visible
    await expect(component.locator('text=Sway Velocity')).toBeVisible();
    await expect(component.locator('text=8.2 cm/s')).toBeVisible();
  });
});
```

### client/src/components/Athletes/AthleteForm.spec.tsx

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import AthleteForm from './AthleteForm';

test.describe('AthleteForm', () => {
  test('renders all form fields', async ({ mount }) => {
    const component = await mount(
      <AthleteForm onSubmit={() => {}} />
    );

    await expect(component.locator('input[name="name"]')).toBeVisible();
    await expect(component.locator('input[name="age"]')).toBeVisible();
    await expect(component.locator('select[name="gender"]')).toBeVisible();
    await expect(component.locator('input[name="parentEmail"]')).toBeVisible();
  });

  test('validates required fields', async ({ mount }) => {
    let submitted = false;

    const component = await mount(
      <AthleteForm onSubmit={() => { submitted = true; }} />
    );

    // Try to submit without filling fields
    await component.locator('button[type="submit"]').click();

    // Should show validation errors
    await expect(component.locator('text=/required/i')).toBeVisible();

    // Should not have submitted
    expect(submitted).toBe(false);
  });

  test('validates email format', async ({ mount }) => {
    const component = await mount(
      <AthleteForm onSubmit={() => {}} />
    );

    await component.locator('input[name="parentEmail"]').fill('invalid-email');
    await component.locator('input[name="parentEmail"]').blur();

    await expect(component.locator('text=/valid email/i')).toBeVisible();
  });

  test('validates age range', async ({ mount }) => {
    const component = await mount(
      <AthleteForm onSubmit={() => {}} />
    );

    // Test below minimum
    await component.locator('input[name="age"]').fill('5');
    await component.locator('input[name="age"]').blur();
    await expect(component.locator('text=/age must be/i')).toBeVisible();

    // Test above maximum
    await component.locator('input[name="age"]').fill('20');
    await component.locator('input[name="age"]').blur();
    await expect(component.locator('text=/age must be/i')).toBeVisible();

    // Test valid age
    await component.locator('input[name="age"]').fill('12');
    await component.locator('input[name="age"]').blur();
    await expect(component.locator('text=/age must be/i')).not.toBeVisible();
  });

  test('submits form with valid data', async ({ mount }) => {
    let submittedData: any = null;

    const component = await mount(
      <AthleteForm onSubmit={(data) => { submittedData = data; }} />
    );

    await component.locator('input[name="name"]').fill('Test Athlete');
    await component.locator('input[name="age"]').fill('12');
    await component.locator('select[name="gender"]').selectOption('male');
    await component.locator('input[name="parentEmail"]').fill('parent@test.com');

    await component.locator('button[type="submit"]').click();

    expect(submittedData).toEqual({
      name: 'Test Athlete',
      age: 12,
      gender: 'male',
      parentEmail: 'parent@test.com',
    });
  });

  test('pre-fills form in edit mode', async ({ mount }) => {
    const existingData = {
      name: 'Existing Athlete',
      age: 11,
      gender: 'female',
      parentEmail: 'parent@example.com',
    };

    const component = await mount(
      <AthleteForm initialData={existingData} onSubmit={() => {}} />
    );

    // Verify fields are pre-filled
    await expect(component.locator('input[name="name"]')).toHaveValue('Existing Athlete');
    await expect(component.locator('input[name="age"]')).toHaveValue('11');
    await expect(component.locator('select[name="gender"]')).toHaveValue('female');
    await expect(component.locator('input[name="parentEmail"]')).toHaveValue('parent@example.com');
  });
});
```

### package.json (add scripts)

```json
{
  "scripts": {
    "test:component": "playwright test -c playwright-ct.config.ts",
    "test:component:ui": "playwright test --ui -c playwright-ct.config.ts"
  }
}
```

## Testing

```bash
# Run component tests
cd client
npm run test:component

# Or with UI
npm run test:component:ui
```

## Estimated Complexity

**Size**: L (Large - ~4-5 hours)

## Notes

- Component tests run faster than E2E tests
- Focus on user-facing behavior, not implementation
- Mock external dependencies (API, MediaPipe)
- Test accessibility (ARIA labels, keyboard navigation)
- Consider visual regression testing for future enhancement
