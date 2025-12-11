# AI Coach Testing Strategy

## Overview

Comprehensive testing strategy covering E2E, integration, component, and unit tests for the AI Coach MVP.

## Testing PRs Summary

| PR | Type | Framework | Complexity | MCP Enhanced |
|----|------|-----------|------------|--------------|
| BE-039 | E2E Tests | Playwright | L (~5h) | ✅ Playwright MCP |
| FE-032 | Component Tests | Playwright CT | L (~5h) | ✅ Playwright MCP |
| FE-033 | API Integration | Vitest + MSW | M (~3h) | ⚠️ Partial |
| BE-040 | Backend Unit | pytest | L (~5h) | ⚠️ Partial |

**Total Testing Effort**: ~18 hours
**Total PRs**: 4 testing PRs (in addition to 67 feature PRs)

## Testing Pyramid

```
        /\
       /  \       E2E Tests (BE-039)
      /____\      - Full user flows
     /      \     - Critical path only
    /  COMP  \    Component Tests (FE-032)
   /__________\   - UI components
  /            \  Integration Tests (FE-033)
 /   UNIT       \ - API calls
/________________\ Unit Tests (BE-040)
                  - Business logic
```

## Layer 1: E2E Tests (BE-039)

### Scope
Full end-to-end user workflows in real browser environment.

### Technology
- **Framework**: Playwright
- **Language**: TypeScript
- **MCP**: Playwright MCP for automation

### Tests Included
1. **Critical Path Test**:
   - Login → Add Athlete → Consent → Record → Analyze → View Results
   - ~2 minutes runtime

2. **Report Generation Test**:
   - Navigate to athlete → Generate report → Send to parent
   - ~1 minute runtime

3. **Assessment History Test**:
   - View past assessments → Click details → Verify metrics
   - ~30 seconds runtime

### Key Features
- Camera mocking (fake MediaStream)
- Video upload simulation
- Backend + Frontend running simultaneously
- Database seeding for test data
- CI integration ready

### Run Commands
```bash
# Local
npm run test:e2e

# With UI
npm run test:e2e:ui

# Headed (see browser)
npm run test:e2e:headed

# CI
npm run test:e2e:ci
```

### Success Criteria
- ✅ All critical path steps complete
- ✅ Metrics displayed correctly
- ✅ No errors in console
- ✅ Video recording works with mock stream

## Layer 2: Component Tests (FE-032)

### Scope
Individual React component testing with visual verification.

### Technology
- **Framework**: Playwright Component Testing
- **Language**: TypeScript/React
- **MCP**: Playwright MCP for visual regression

### Components Tested
1. **SkeletonOverlay**: Canvas rendering, MediaPipe integration
2. **CountdownTimer**: Countdown accuracy, styling changes
3. **VideoPlayer**: Play/pause controls, duration display
4. **MetricsCard**: Data display, expandable sections, score badges
5. **AthleteForm**: Validation, submission, edit mode

### Key Features
- Visual regression testing
- Screenshot comparison
- Isolated component rendering
- Mock data fixtures
- Fast execution (<1 min total)

### Run Commands
```bash
# All component tests
npm run test:component

# With UI
npm run test:component:ui

# Watch mode
npm run test:component:watch
```

### Success Criteria
- ✅ All components render correctly
- ✅ User interactions work as expected
- ✅ Form validation catches errors
- ✅ Visual snapshots match baseline

## Layer 3: API Integration Tests (FE-033)

### Scope
Frontend API client testing with mocked backend responses.

### Technology
- **Framework**: Vitest
- **Mocking**: MSW (Mock Service Worker)
- **Language**: TypeScript

### APIs Tested
1. **Authentication**: Login, logout, token validation
2. **Athletes**: CRUD operations, consent handling
3. **Assessments**: Upload, analyze, retrieve
4. **Reports**: Generate, send, view

### Key Features
- No real backend needed
- Fast execution (<10 seconds)
- Predictable responses
- Error scenario testing
- Network error simulation

### Run Commands
```bash
# All API tests
npm test

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

### Success Criteria
- ✅ All API calls include auth token
- ✅ Responses parsed correctly
- ✅ Error handling works
- ✅ >80% code coverage

## Layer 4: Backend Unit Tests (BE-040)

### Scope
Pure business logic testing for CV metrics and scoring.

### Technology
- **Framework**: pytest
- **Language**: Python
- **Coverage**: pytest-cov

### Modules Tested
1. **MediaPipe Service**:
   - Sway metrics calculation
   - Arm excursion calculation
   - Stability score formula
   - Low-pass filtering

2. **Scoring Service**:
   - Duration score (1-5)
   - Percentile calculation
   - Team ranking

3. **Failure Detection**:
   - Foot touchdown
   - Hands leaving hips
   - Support foot movement
   - Time completion

4. **Agent Orchestrator**:
   - Request routing
   - Agent selection

### Key Features
- Mock external dependencies
- Test edge cases
- Fast execution (<30 seconds)
- High code coverage
- CI integration

### Run Commands
```bash
# All unit tests
pytest

# With coverage
pytest --cov

# Specific module
pytest tests/test_scoring_service.py

# Verbose
pytest -v
```

### Success Criteria
- ✅ All business logic tested
- ✅ Edge cases covered
- ✅ >80% code coverage
- ✅ No external dependencies

## Test Data Management

### Fixtures Location
```
tests/
├── e2e/
│   ├── fixtures/
│   │   ├── test-video.mp4
│   │   └── test-landmarks.json
│   └── utils/
│       ├── camera-mock.ts
│       └── test-helpers.ts
├── component/
│   └── fixtures.ts
├── api/
│   └── api-handlers.ts
└── unit/
    └── conftest.py
```

### Test Database
- **Separate Firebase Project**: `ltad-coach-test`
- **Seeding**: `npm run test:seed`
- **Cleanup**: Automatic after each test suite

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Backend Unit Tests
        run: cd backend && pytest --cov

      - name: Frontend API Tests
        run: cd client && npm test

  component-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Component Tests
        run: cd client && npm run test:component

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: E2E Tests
        run: npm run test:e2e

      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-failures
          path: test-results/
```

### Test Execution Order
1. **Unit tests** (fastest, ~30s)
2. **API integration tests** (~10s)
3. **Component tests** (~1m)
4. **E2E tests** (slowest, ~3m)

Total CI time: ~5 minutes

## Coverage Goals

| Layer | Coverage Target | Current |
|-------|----------------|---------|
| Backend Unit | >80% | TBD |
| Frontend API | >80% | TBD |
| Component | >70% | TBD |
| E2E | Critical paths | TBD |

## Testing Best Practices

### 1. Test Naming Convention
```python
# Backend (pytest)
def test_calculate_sway_metrics_returns_valid_range():
    pass

# Frontend (Vitest)
test('calculates sway metrics within valid range', () => {})
```

### 2. Arrange-Act-Assert Pattern
```typescript
// Arrange
const component = await mount(<MetricsCard metrics={mockData} />);

// Act
await component.click('button:has-text("View Details")');

// Assert
await expect(component.locator('text=Sway Velocity')).toBeVisible();
```

### 3. Mock External Dependencies
```python
@pytest.fixture
def mock_firebase_db(mocker):
    return mocker.patch('app.services.database.db')
```

### 4. Use Fixtures for Common Data
```typescript
export const mockAthleteData = {
  id: 'test-1',
  name: 'Test Athlete',
  age: 12,
  // ...
};
```

## Debugging Failed Tests

### E2E Test Failures
```bash
# Run in headed mode
npm run test:e2e:headed

# View test report
npx playwright show-report

# Debug specific test
npx playwright test --debug critical-path.spec.ts
```

### Component Test Failures
```bash
# Run with UI
npm run test:component:ui

# Update snapshots
npm run test:component -- --update-snapshots
```

### Unit Test Failures
```bash
# Run with verbose output
pytest -vv

# Run specific test
pytest tests/test_scoring_service.py::test_score_1_beginning

# Drop into debugger
pytest --pdb
```

## Test Maintenance

### When to Update Tests

1. **Feature Changes**: Update affected tests
2. **API Changes**: Update API integration tests
3. **UI Changes**: Update component snapshots
4. **Bug Fixes**: Add regression test

### Test Review Checklist

- [ ] All new features have tests
- [ ] Tests are deterministic (no flaky tests)
- [ ] Test names are descriptive
- [ ] Edge cases are covered
- [ ] Mocks are realistic
- [ ] Tests run in CI
- [ ] Coverage meets targets

## Performance Targets

| Test Suite | Target Time | Max Time |
|------------|-------------|----------|
| Backend Unit | <30s | 1m |
| Frontend API | <10s | 30s |
| Component | <1m | 2m |
| E2E | <3m | 5m |

**Total**: <5 minutes for full test suite

## MCP Enhancement Opportunities

### Using Playwright MCP

**Generate Tests**:
```
"Create a Playwright test that verifies the skeleton overlay renders at 30 FPS"

"Generate visual regression tests for the assessment results page"
```

**Debug Tests**:
```
"This test is failing - help me debug the camera mock"

"Generate screenshots at each step of the assessment flow"
```

### Using Sequential Thinking MCP

**Optimize Tests**:
```
"Analyze test execution time and suggest optimizations"

"Identify flaky tests and recommend fixes"
```

## Future Enhancements

### Phase 2 (Post-MVP)
- [ ] Visual regression testing with Percy/Chromatic
- [ ] Load testing with k6
- [ ] Accessibility testing with axe-core
- [ ] Mobile device testing (iOS/Android)
- [ ] Cross-browser testing (Safari, Firefox)

### Phase 3 (Production)
- [ ] Chaos engineering tests
- [ ] Security penetration tests
- [ ] Performance monitoring integration
- [ ] Real user monitoring (RUM)

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [pytest Documentation](https://docs.pytest.org/)
- [MSW Documentation](https://mswjs.io/)

---

**Last Updated**: December 10, 2025
**Total Test Coverage**: 4 comprehensive test suites across all layers
