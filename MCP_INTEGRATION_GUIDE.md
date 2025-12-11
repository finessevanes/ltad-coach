# MCP Integration Guide for AI Coach

## Overview

This guide explains how Model Context Protocol (MCP) servers can enhance development, testing, and maintenance of the AI Coach platform.

## Recommended MCPs

### 1. **@modelcontextprotocol/server-playwright** (Browser Automation)

**Installation**:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

**Use Cases**:
- **BE-039 (E2E Testing)**: Generate comprehensive E2E test scripts
- **FE-017 (MediaPipe Testing)**: Verify skeleton overlay renders correctly
- **FE-018 (Recording Flow)**: Test camera permissions and video recording
- **FE-032 (Component Tests)**: Create visual regression tests
- **Debugging**: Screenshot specific UI states during development

**Example Prompts**:
```
"Using Playwright MCP, create a test that verifies the skeleton overlay renders on live video"

"Generate a Playwright script to test the full assessment flow from login to results"

"Create screenshots of the assessment results page with different score values"
```

### 2. **@modelcontextprotocol/server-filesystem** (Code Navigation)

**Installation**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/finessevanes/Desktop/ltad-coach"
      ]
    }
  }
}
```

**Use Cases**:
- Quick file lookups during PR implementation
- Finding related code patterns
- Verifying file structure matches PR specifications
- Understanding authentication flow across frontend/backend

**Example Prompts**:
```
"Find all files that implement athlete management in the backend"

"Show me the structure of the MediaPipe service"

"List all API endpoints defined in the codebase"
```

### 3. **@modelcontextprotocol/server-sequential-thinking** (Complex Problem Solving)

**Installation**:
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Use Cases**:
- **BE-014 (MediaPipe Setup)**: Debugging pose detection issues
- **BE-027 (Assessment Agent)**: Optimizing prompt engineering
- **FE-017 (Skeleton Overlay)**: Resolving canvas rendering performance
- **Architecture Decisions**: Evaluating trade-offs

**Example Prompts**:
```
"Help me debug why MediaPipe landmarks aren't being detected"

"Analyze the trade-offs between client-side vs server-side video processing"

"Optimize the stability score calculation for better performance"
```

### 4. **context7** (Semantic Code Search) - If Available

**Use Cases**:
- Understanding complex code flows
- Finding similar implementation patterns
- Identifying potential refactoring opportunities

## Testing PRs with MCP Integration

### BE-039: E2E Testing with Playwright MCP

**Workflow**:
1. Install Playwright MCP
2. Ask Claude to generate test scripts: *"Create E2E test for full assessment flow"*
3. MCP generates browser automation code
4. Run tests and iterate with Claude

**Benefits**:
- Faster test creation
- More comprehensive test coverage
- Visual regression testing
- Screenshot comparison

### FE-032: Component Testing with Playwright MCP

**Workflow**:
1. Use Playwright Component Testing
2. Ask: *"Generate component tests for SkeletonOverlay with visual verification"*
3. MCP creates tests that verify canvas rendering
4. Add to CI pipeline

### FE-033: API Integration Testing

**While MCP doesn't directly test APIs, it can**:
- Generate MSW mock handlers
- Create test fixtures
- Write comprehensive test cases

## Development Workflows with MCPs

### Workflow 1: Implementing a New PR

```bash
# 1. Read PR specification
cat backend/prds/PR-014-mediapipe-setup.md

# 2. Use Filesystem MCP to understand structure
"Show me the current structure of the services directory"

# 3. Implement with Claude's help
"Implement the MediaPipe service according to PR-014"

# 4. Use Playwright MCP to test
"Generate a test that verifies landmark extraction works"
```

### Workflow 2: Debugging Issues

```bash
# 1. Describe the issue
"The skeleton overlay isn't rendering on the video"

# 2. Use Sequential Thinking MCP
"Walk through the potential causes of canvas not rendering"

# 3. Use Playwright MCP to reproduce
"Create a test that reproduces this rendering issue"

# 4. Fix and verify
"Generate a screenshot comparison test to prevent regression"
```

### Workflow 3: Code Review

```bash
# 1. Use Filesystem MCP
"Show me all changes in the authentication flow"

# 2. Analyze with Claude
"Review this code for security issues and best practices"

# 3. Generate tests with Playwright MCP
"Create tests that verify auth edge cases"
```

## MCP-Enhanced PR Implementation Examples

### Example 1: BE-017 (Arm Excursion Metrics)

**Without MCP**:
- Manually write calculations
- Manually create test fixtures
- Manual testing with sample videos

**With MCP**:
```
1. "Using Filesystem MCP, show me similar metric calculations"
2. "Implement arm excursion metrics following the pattern in sway metrics"
3. "Generate pytest tests with sample landmark data"
4. "Use Sequential Thinking to optimize the calculation algorithm"
```

### Example 2: FE-017 (Skeleton Overlay)

**Without MCP**:
- Trial and error with canvas rendering
- Manual visual verification
- No automated regression testing

**With MCP**:
```
1. "Using Playwright MCP, create a visual regression test for skeleton overlay"
2. "Generate screenshots of the skeleton at different pose positions"
3. "Create a test that verifies 30 FPS rendering performance"
4. "Set up CI to catch visual regressions automatically"
```

## CI/CD Integration

### GitHub Actions with MCP Tests

```yaml
name: MCP-Enhanced Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup MCP Servers
        run: |
          npm install -g @modelcontextprotocol/server-playwright

      - name: Run Playwright E2E Tests
        run: npm run test:e2e

      - name: Upload Screenshots
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test-results/
```

## Best Practices

### 1. **Use Playwright MCP for Visual Testing**
- Always verify UI components visually
- Create screenshot baselines
- Automate visual regression detection

### 2. **Use Filesystem MCP for Code Navigation**
- Understand existing patterns before implementing
- Find related files quickly
- Verify consistency across codebase

### 3. **Use Sequential Thinking for Complex Logic**
- Debug MediaPipe issues systematically
- Optimize AI agent prompts
- Resolve performance bottlenecks

### 4. **Combine MCPs for Maximum Efficiency**
```
"Using Filesystem MCP, find the authentication implementation.
Then using Sequential Thinking, identify potential security vulnerabilities.
Finally, using Playwright MCP, generate tests for those edge cases."
```

## Testing Coverage with MCPs

### Current Testing PRs

| PR | Type | MCP Enhanced |
|----|------|--------------|
| BE-039 | E2E Tests | ✅ Playwright MCP |
| FE-032 | Component Tests | ✅ Playwright MCP |
| FE-033 | API Integration Tests | ⚠️ Manual (MSW mocks) |
| BE-040 | Backend Unit Tests | ⚠️ Manual (pytest) |

### Recommended MCP Usage by PR

**High Value** (Use MCPs extensively):
- BE-039: Playwright for E2E automation
- FE-032: Playwright for visual component testing
- BE-014-018: Sequential Thinking for CV algorithms
- BE-025-028: Sequential Thinking for prompt optimization

**Medium Value** (Use MCPs selectively):
- BE-008-011: Filesystem for understanding API patterns
- FE-007-009: Playwright for form testing
- FE-016-019: Playwright for camera/video testing

**Low Value** (MCPs less helpful):
- BE-001-003: Project setup (straightforward)
- BE-020: Data seeding (simple scripts)
- FE-001-003: Basic configuration

## Troubleshooting

### Issue: Playwright MCP can't access browser

**Solution**:
```bash
# Install browsers
npx playwright install

# Grant permissions
npx playwright install-deps
```

### Issue: Filesystem MCP permission denied

**Solution**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/absolute/path/to/project"  // Use absolute path
      ]
    }
  }
}
```

### Issue: Sequential Thinking takes too long

**Solution**:
- Ask more specific questions
- Break complex problems into smaller steps
- Use for algorithmic/architectural questions only

## Summary

**Key Benefits of MCP Integration**:
1. **Faster Development**: Auto-generate tests and boilerplate
2. **Better Quality**: Visual regression testing catches UI bugs
3. **Easier Debugging**: Systematic problem-solving with Sequential Thinking
4. **Improved Onboarding**: Filesystem MCP helps new devs navigate codebase

**Recommended Setup for AI Coach**:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/finessevanes/Desktop/ltad-coach"
      ]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Next Steps**:
1. Install recommended MCPs
2. Start with BE-039 (E2E tests) using Playwright MCP
3. Use Filesystem MCP during all PR implementations
4. Leverage Sequential Thinking for complex debugging

---

**Note**: MCPs are optional but highly recommended for efficiency and quality. All PRs can be completed without MCPs, but using them will significantly speed up development and improve test coverage.
