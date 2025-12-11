# Playwright MCP Screenshot Guide

## The Problem

Some screenshots were blank because they were captured before React finished rendering the page.

**Root Cause**: Playwright's default `load` event fires when HTML is parsed, but React SPAs need extra time to hydrate and render content.

**Evidence**:
- Successful screenshots: 86KB (full content)
- Blank screenshots: 7KB (white screen only)
- Same page, different timing = different results

---

## The Solution

**Always wait for the page to fully render before taking screenshots.**

### Standard Pages (Landing, Login, Dashboard)

```javascript
await page.goto('http://localhost:5173/');
await page.waitForLoadState('networkidle');  // Wait for network requests to finish
await page.waitForTimeout(1000);             // Extra 1 second for React hydration
await page.screenshot({ path: 'landing.png' });
```

### Video/Camera Pages (Recording, Camera Setup)

```javascript
await page.goto('http://localhost:5173/athletes/123/assess/recording');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);             // Extra 2 seconds for MediaPipe initialization
await page.screenshot({ path: 'recording.png' });
```

---

## Quick Reference

| Page Type | Wait Strategy | Delay |
|-----------|--------------|-------|
| Landing/Login | `networkidle` | 1000ms |
| Dashboard | `networkidle` | 1000ms |
| Athletes List | `networkidle` | 1000ms |
| Recording/Camera | `networkidle` | 2000ms |
| Assessment Results | `networkidle` | 1500ms |

---

## Examples

### Taking Multiple Screenshots

```javascript
// Wait once, then take multiple screenshots
await page.goto('http://localhost:5173/');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// Now safe to take multiple screenshots rapidly
await page.screenshot({ path: 'screenshot-1.png' });
await page.screenshot({ path: 'screenshot-2.png' });
await page.screenshot({ path: 'screenshot-3.png' });
```

### Full Page Screenshot

```javascript
await page.goto('http://localhost:5173/');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'landing-full.png', fullPage: true });
```

### Screenshot Specific Element

```javascript
await page.goto('http://localhost:5173/dashboard');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

const element = await page.locator('[data-testid="athlete-card"]');
await element.screenshot({ path: 'athlete-card.png' });
```

---

## Troubleshooting

### Still Getting Blank Screenshots?

1. **Increase the delay**: Try 2000ms or 3000ms instead of 1000ms
2. **Wait for specific element**:
   ```javascript
   await page.waitForSelector('text=Welcome'); // Wait for specific text
   ```
3. **Check browser state**: Make sure the browser tab is focused

### Screenshots Are Too Dark/Wrong Colors?

- This is a rendering issue, not a timing issue
- Try: `await page.emulateMedia({ colorScheme: 'light' });`

### Video Not Visible in Screenshots?

- Video elements need extra time to initialize
- Use 2000ms+ delay for pages with video
- Grant camera permissions: `await context.grantPermissions(['camera']);`

---

## Why This Works

**React SPA Loading Sequence**:
1. HTML loads (instant) → `load` event fires ❌ Too early
2. JavaScript downloads (100-300ms)
3. React hydrates page (200-500ms)
4. CSS-in-JS styles inject (100-200ms)
5. Content renders ✅ Safe to screenshot

**`networkidle`**: Waits until no network requests for 500ms (ensures JS/CSS loaded)

**Extra delay**: Gives React time to hydrate and render components

---

## Best Practices

✅ **DO**: Always use `waitForLoadState('networkidle')` + delay
✅ **DO**: Use longer delays for complex pages (video, MediaPipe)
✅ **DO**: Take multiple screenshots after one wait period

❌ **DON'T**: Take screenshots immediately after `page.goto()`
❌ **DON'T**: Rely on `load` event alone for React SPAs
❌ **DON'T**: Navigate → screenshot → navigate → screenshot rapidly

---

## Summary

**Problem**: Blank screenshots from capturing before React rendered

**Solution**: Wait for `networkidle` + 1-2 second delay

**Result**: No more blank screenshots 🎉
