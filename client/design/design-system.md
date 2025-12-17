# Coach Lens Design System
## Minimalist Athletic v3.0

**Last Updated:** December 17, 2025  
**Target Platform:** Desktop Web Application (Mobile-responsive)  
**Component Library:** Material-UI (MUI) v5+ with custom theme  
**Target Audience:** Youth sports coaches, middle school athletes (ages 10-14), parents

---

## Overview

The Coach Lens design system embodies minimalist athletic design - bold, high-contrast, and energetic. Built on Material-UI with extensive customization, this system uses a stark white/black/gray foundation with lime green as a vibrant accent to create an interface that feels modern, professional, and athletic.

**Brand Philosophy:** Bold, modern coaching tool with maximum impact. Black text on white backgrounds for clarity, lime green for energy and action. Every interaction should feel sharp, confident, and direct.

---

## Design Tokens

### Color Palette

#### Brand Colors
```
Lime Green (Primary Accent)
- Hex: #D4FF00
- Light: #E3FF4D
- Dark: #A3CC00
- Usage: Primary CTAs, key actions, active states, progress indicators, highlights
- Contrast Text: #000000 (black)
- Backgrounds: #F7FEE7 (very light lime for backgrounds)
- Impact: Electric, energetic, modern, immediately draws attention

Softer Lime (Success States)
- Hex: #84CC16
- Light: #A3E635
- Dark: #65A30D
- Usage: Success states, completed items, positive indicators
- Less intense than primary lime for sustained viewing
```

#### Neutral Colors (Foundation)
```
Black: #000000 - Primary text, headings, high-emphasis CTAs, secondary color
  - Pure black for maximum contrast and readability
  - Used for all body text and headings
  - Black buttons for strongest emphasis

Charcoal: #2D2D2D - Button hover states, subtle blacks
  - Lighter alternative to pure black
  - Hover states for black buttons

Gray: #6B6B6B - Secondary text, captions, inactive states
  - Mid-tone gray for less important text
  - Metadata, timestamps, helper text

Light Gray: #F5F5F5 - Default background (base page background)
  - Subtle background provides depth
  - Creates contrast with white cards

White: #FFFFFF - Card surfaces (paper), elevated components
  - Primary surface color
  - All cards and elevated components

Border: #E5E5E5 - Borders, dividers, input outlines
  - Subtle separation between elements
```

#### Semantic Colors
```
Success: #84CC16 (bg: #F7FEE7) - Softer lime for completed states, positive feedback
Warning: #F59E0B (bg: #FEF3C7) - Amber for warnings, needs attention
Error: #EF4444 (bg: #FEE2E2) - Red for errors, critical alerts
Info: #6B6B6B (bg: #F5F5F5) - Gray for neutral information, tips
```

#### Skeleton Overlay System (Computer Vision)
**Traffic Light Color System** - Universally understood real-time movement feedback
```
Good (Proper Form):
- Color: #10B981 (Success Green)
- Usage: Proper form, good positioning, test going well

Warning (Form Deviation):
- Color: #F59E0B (Warning Orange)
- Usage: Form deviation, approaching failure, needs correction

Fail (Failure Detected):
- Color: #EF4444 (Error Red)
- Usage: Failure detected, hands off hips, foot touchdown

Neutral (Setup):
- Color: #60A5FA (Neutral Blue)
- Usage: Setup phase, no assessment yet, waiting to start

Style Specs:
- Line width: 3px
- Joint marker size: 8px
- Joint marker style: Circle with dot center
- Opacity: 0.85 (semi-transparent to see athlete beneath)
```

#### Score Color System (1-5 Scale)
**For Athlete Assessment Scores** - Familiar grading system for coaches
```
1 - Beginning (#EF4444 Red): Needs work
2 - Developing (#F59E0B Orange): Improving
3 - Competent (#FB923C Light Orange): Solid
4 - Proficient (#34D399 Light Green): Excellent
5 - Advanced (#10B981 Green): Outstanding
```

### Typography

**Font Family:** Jost (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;600;700&display=swap" rel="stylesheet">
```

#### Type Scale
```
Display (Hero Headlines)
- Size: 72px
- Weight: 700 (Bold)
- Line Height: 1.1
- Letter Spacing: -0.02em
- Usage: Landing page headers, major announcements

H1 (Page Titles)
- Size: 48px
- Weight: 600 (SemiBold)
- Line Height: 1.2
- Letter Spacing: -0.01em
- Usage: Main page headings

H2 (Section Headers)
- Size: 32px
- Weight: 600 (SemiBold)
- Line Height: 1.3
- Letter Spacing: -0.01em
- Usage: Section titles, card headers

H3 (Subsection Headers)
- Size: 24px
- Weight: 600 (SemiBold)
- Line Height: 1.4
- Usage: Component titles, subsections

H4 (Small Headers)
- Size: 18px
- Weight: 600 (SemiBold)
- Line Height: 1.4
- Usage: List titles, small headers

Body (Main Text)
- Size: 18px
- Weight: 400 (Regular)
- Line Height: 1.6
- Usage: Primary content, descriptions

Body Small (Secondary Text)
- Size: 16px
- Weight: 400 (Regular)
- Line Height: 1.5
- Usage: Form labels, secondary content

Caption (Metadata)
- Size: 14px
- Weight: 400 (Regular)
- Line Height: 1.5
- Usage: Timestamps, captions, helper text

Small (Fine Print)
- Size: 12px
- Weight: 400 (Regular)
- Line Height: 1.5
- Usage: Chart labels, legal text
```

### Spacing

**Base Unit: 8px**

```
xs: 8px
sm: 12px
md: 16px
lg: 24px (component gap - USE THIS BETWEEN MAJOR ELEMENTS)
xl: 32px (card padding - USE THIS INSIDE CARDS)
2xl: 48px
3xl: 64px (section gap - USE THIS BETWEEN SECTIONS)
4xl: 80px
```

**Common Patterns:**
- Space between cards/components: 24px
- Space between sections: 64px
- Card internal padding: 32px
- Button padding: 12px 24px
- Input padding: 12px 16px

### Border Radius

```
sm: 8px - Small elements
md: 12px - Buttons, inputs, nav items
lg: 16px - Images, small cards
xl: 24px - Large cards, containers (PRIMARY)
full: 999px - Pills, badges, progress bars
```

**Standard Usage:**
- Cards: 24px
- Buttons: 12px
- Inputs: 12px
- Badges: 999px
- Images: 16px
- Icon containers: 12px

### Shadows

```
Card Shadow (Default): 0 2px 8px rgba(0, 0, 0, 0.08)
Card Hover: 0 4px 16px rgba(0, 0, 0, 0.12)
Subtle: 0 1px 2px rgba(0, 0, 0, 0.05)
None: No shadow
```

**Usage:**
- All cards get the default shadow
- Inputs: No shadow
- Buttons: No shadow
- Hover states: Elevated shadow

### Transitions

```
Fast: 0.15s ease - Small interactions
Base: 0.2s ease - Standard (USE THIS)
Slow: 0.3s ease - Large movements
```

**Standard Application:**
```css
transition: all 0.2s ease;
```

---

## Components

### Buttons

**Primary Button (Lime Green)**
```css
background: #D4FF00
color: #000000
padding: 12px 24px
font-size: 16px
font-weight: 600
border-radius: 12px
border: none

hover: background #A3CC00
```

**Secondary Button (Black)**
```css
background: #000000
color: #FFFFFF
padding: 12px 24px
font-size: 16px
font-weight: 600
border-radius: 12px
border: none

hover: background #2D2D2D
```

**Outlined Button**
```css
background: transparent
color: #000000
padding: 12px 24px
font-size: 16px
font-weight: 600
border-radius: 12px
border: 2px solid #E5E5E5

hover: border-color #D4FF00, color #D4FF00
```

**Text Button**
```css
background: transparent
color: #6B6B6B
padding: 12px 16px
font-size: 16px
font-weight: 600
border-radius: 12px
border: none

hover: color #000000
```

**Button with Icon:**
- Icon size: 20px
- Gap between text and icon: 8px
- Use lucide-react icons

**Suggestion Button (AI Coach Welcome)**
```css
background: #FFFFFF
color: #000000
padding: 12px 24px
font-size: 16px
font-weight: 600
border-radius: 12px
border: 1px solid #E5E5E5

hover: 
  background: #FFFFFF
  border-color: #D4FF00 (neon yellow/lime green)
```

**Usage:** Used in AI Coach welcome screen for suggestion buttons (Exercise, Analyze, Progress). White fill maintained on hover with neon yellow border highlight.

### Cards

**Standard Card**
```css
background: #FFFFFF
border-radius: 24px
padding: 32px
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
border: 1px solid #F5F5F5

hover: 
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12)
  transform: translateY(-2px)
```

**Card Variants:**
- **Elevated:** Stronger shadow (0 4px 16px rgba(0, 0, 0, 0.12))
- **Flat:** No shadow, border: 1px solid #E5E5E5
- **Outlined:** Transparent background, 2px solid border

### Form Elements

**Text Input**
```css
padding: 12px 16px
font-size: 16px
border: 2px solid #E5E5E5
border-radius: 12px
background: #FFFFFF
color: #2D2D2D
font-family: 'Jost', sans-serif

focus:
  border-color: #2563EB
  outline: none

error:
  border-color: #EF4444
```

**Input Label**
```css
font-size: 14px
font-weight: 600
color: #2D2D2D
margin-bottom: 8px
display: block
```

**Select/Dropdown**
- Same styling as text input
- Include dropdown arrow icon

**Checkbox/Radio**
- Size: 20px
- Accent color: #2563EB
- Gap to label: 12px

### Badges

**Structure:**
```css
padding: 6px 16px
border-radius: 999px
font-size: 14px
font-weight: 600
display: inline-block
```

**Variants:**
- Primary: color #2563EB, bg #EFF6FF
- Secondary: color #F97316, bg #FFF7ED
- Success: color #10B981, bg #ECFDF5
- Warning: color #F59E0B, bg #FEF3C7
- Neutral: color #6B6B6B, bg #F5F5F5

### Icon Containers

**Structure:**
```css
padding: 12px
border-radius: 12px
display: flex
align-items: center
justify-content: center
```

**Variants:**
- Primary: background #EFF6FF (with Athletic Blue icon)
- Secondary: background #FFF7ED (with Energy Orange icon)
- Success: background #ECFDF5 (with green icon)

**Icon Sizes:**
- Small: 20px
- Medium: 24px (STANDARD)
- Large: 32px

### Progress Bars

**Container:**
```css
height: 8px
background: #F5F5F5
border-radius: 999px
overflow: hidden
width: 100%
```

**Fill:**
```css
background: #2563EB
border-radius: 999px
height: 100%
transition: width 0.3s ease
```

**Label Structure:**
```css
display: flex
justify-content: space-between
margin-bottom: 8px
font-size: 14px
color: #6B6B6B
```

### Navigation

**Nav Item (Default)**
```css
padding: 12px 20px
border-radius: 12px
font-size: 16px
background: transparent
color: #6B6B6B
font-weight: 400
display: flex
align-items: center
gap: 8px
```

**Nav Item (Active)**
```css
background: #EFF6FF
color: #2563EB
font-weight: 600
```

**Nav Item (Hover)**
```css
background: #F5F5F5
```

### Data Visualization

**Line Charts:**
- Line color: #2563EB
- Line width: 3px
- Point radius: 6px
- Grid color: #F5F5F5
- Label color: #6B6B6B
- Label size: 12px

**Bar Charts:**
- Bar color: #2563EB
- Spacing: 8px between bars
- Labels: 12px, #6B6B6B

**Stat Display:**
- Value size: 48px
- Value weight: 700
- Value color: #2D2D2D
- Label size: 14px
- Label color: #6B6B6B
- Trend indicator: #F97316 with TrendingUp icon

---

## Layout Patterns

### Container
```
Max width: 1200px
Padding:
  Mobile: 24px
  Tablet: 48px
  Desktop: 64px
```

### Grid Spacing
```
Tight: 16px gap
Base: 24px gap (STANDARD)
Loose: 32px gap
```

### Breakpoints
```
Mobile: 0px
Tablet: 768px
Desktop: 1024px
Wide: 1280px
```

---

## Common Patterns

### Stat Card Pattern
```
Layout: Flex column
Gap: 16px
Padding: 32px
Elements:
  1. Icon container (top-right)
  2. Label (14px, gray)
  3. Large value (48px, bold, charcoal)
  4. Trend indicator (14px, orange)
```

### Achievement Card Pattern
```
Layout: Flex row
Gap: 16px
Padding: 32px
Elements:
  1. Icon container (left, fixed width)
  2. Content (right, flexible):
     - Title (18px, semibold)
     - Description (14px, gray)
```

### Progress Card Pattern
```
Layout: Flex column
Gap: 16px
Padding: 32px
Elements:
  1. Card title (18px, semibold)
  2. Multiple progress bars:
     - Label + percentage
     - Progress bar
     - 16px gap between each
```

### Hero Section Pattern
```
Layout: Flex column, centered
Gap: 24px
Padding: 64px 24px
Elements:
  1. Display headline (72px)
  2. Description (18px)
  3. Primary CTA button
```

### Dashboard Header Pattern (NEW - Dec 2025)
```
Layout: Flex row, space-between
Gap: 16px
Margin Bottom: 40px (5 spacing units)
Elements:
  1. Greeting text:
     - Font size: 2rem (xs) to 2.5rem (md+)
     - Font weight: 900
     - Text transform: UPPERCASE
     - Letter spacing: -0.02em
     - Color: #2D2D2D
     - Pattern: "GOOD MORNING, COACH."
  2. Primary action button (right-aligned)
```

### Section Header with Divider Pattern (NEW - Dec 2025)
```
Layout: Flex row, space-between
Border Bottom: 1px solid #E5E5E5
Padding Bottom: 12px
Margin Bottom: 16px
Elements:
  1. Title (left):
     - Font size: 1.125rem
     - Font weight: 700
     - Text transform: UPPERCASE
     - Letter spacing: 0.5px
     - Color: #2D2D2D
  2. Optional metadata (right):
     - Font size: 0.75rem
     - Font weight: 700
     - Color: #2D2D2D
  3. Optional indicator dot (right):
     - Size: 8px circle
     - Background: #EF4444 (for pending items)
```

### List Card with Status Accent Pattern (NEW - Dec 2025)
```
Layout: Vertical stack
Gap: 8px between items
Item Structure:
  - Background: #FFFFFF
  - Border: 1px solid #E5E5E5
  - Border Left: 4px solid [status-color]
  - Border Radius: 4px (8px for standalone cards)
  - Padding: 16px
  - Box Shadow: 0 1px 3px rgba(0, 0, 0, 0.08)
  - Hover: background #F5F5F5
Status Colors:
  - High Priority: #EF4444 (red)
  - Approval Needed: #D4FF00 (lime-yellow)
  - Medium Priority: #F59E0B (orange)
  - Success/Active: #10B981 (green)
```

### Avatar List Item Pattern (NEW - Dec 2025)
```
Layout: List with flex items
Gap: 8px between items
Item Structure:
  - Card container with 1px border
  - Box shadow: 0 1px 3px rgba(0, 0, 0, 0.08)
  - Padding: 12px 16px
  - Border radius: 4px
  - Hover: background #F5F5F5
Elements:
  1. Avatar (left):
     - Size: 48px circle
     - Background: Status-based color
     - Initial: First letter, uppercase, white text
     - Font weight: 700
  2. Text content (right):
     - Name: 600 weight, body1 size
     - Optional subtitle: 400 weight, body2 size
```

### Priority Badge Pattern (NEW - Dec 2025)
```
Display: Inline-block
Padding: 4px 12px
Border Radius: 4px
Margin Bottom: 8px
Text:
  - Font size: 0.65rem
  - Font weight: 700
  - Text transform: UPPERCASE
  - Letter spacing: 0.5px
Variants:
  - High Priority:
    - Background: #FFFFFF
    - Text color: #EF4444
    - Border: none
  - Approval:
    - Background: #F7FEE7
    - Text color: #84CC16
  - Medium:
    - Background: #FEF3C7
    - Text color: #F59E0B
```

### Skeleton Loading Pattern (NEW - Dec 2025)
```
Purpose: Match final UI structure exactly
Best Practices:
  - Use MUI Skeleton component
  - Match card structure and spacing
  - Include all major layout elements
  - Use appropriate variants:
    - text: For text content
    - circular: For avatars
    - rectangular: For images/buttons
Example Structure:
  1. Header skeleton (matches section header)
  2. List item skeletons (match final card structure)
  3. Gap spacing matches final UI (8px-24px)
```

---

## Product-Specific Decisions

### Athlete Avatars
**MVP Approach: Initials Only**
```
Why: Reduces complexity, avoids privacy concerns, simplifies onboarding
Shape: Circle (40px diameter)
Background: Deterministic color from preset palette based on name hash
Colors: [Athletic Blue, Energy Orange, Success Green, Purple, Pink, Cyan]
Text: Initials (16px, 600 weight, white)
Future: Photo upload post-MVP
```

### Empty States
**Style: Clean Icons + Helpful Text + Clear CTA**
```
Why: Professional for coaches (not childish illustrations)
Icon: 64px, #BDBDBD gray, from @mui/icons-material
Heading: 24px semibold
Body: 16px regular
Action: Primary contained button
Spacing: 24px gap between elements

Examples:
1. No Athletes
   - Icon: PeopleOutline
   - Heading: "No athletes yet"
   - Body: "Add your first athlete to get started with assessments."
   - Action: "Add Athlete"

2. No Assessments
   - Icon: AssessmentOutlined
   - Heading: "No assessments recorded"
   - Body: "Start your first assessment to track progress."
   - Action: "New Assessment"

3. No Results
   - Icon: SearchOff
   - Heading: "No results found"
   - Body: "Try adjusting your filters or search terms."
   - Action: "Clear Filters"
```

### Error Handling Strategy
**Severity-Based Display**
```
Critical (Blocks workflow):
- Display: Modal dialog
- Examples: Camera access denied, video upload failed
- Actions: Retry, Cancel
- MUI: Dialog component

Important (Needs attention):
- Display: Alert banner at top
- Examples: Consent expired, athlete limit reached
- Dismissible: Yes
- MUI: Alert component

Minor (Informational):
- Display: Snackbar (bottom-center)
- Examples: Settings saved, report sent
- Auto-hide: 4 seconds
- MUI: Snackbar component

Inline (Form errors):
- Display: Helper text below field
- Examples: Validation errors
- MUI: FormHelperText component
```

### Video Player Controls
**For Movement Analysis**
```
Seek bar: 4px height, Athletic Blue
Controls: 48px height, rgba(0,0,0,0.8) background
Icons: 24px, white
Playback speeds: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
Frame-by-frame: Yes (1/30s step at 30fps)
Overlays: Skeleton toggle, metrics display, timestamp
```

### Dashboard Stats Cards
**Real-Time Data Display**
```
Update frequency: WebSocket or 30s polling
Trend indicators:
- Up: TrendingUp icon, #10B981
- Down: TrendingDown icon, #EF4444
- Stable: TrendingFlat icon, #6B6B6B
Color coding: Neutral card, colored trends only
```

---

## Design Principles

### Visual Principles
1. **Generous White Space** - Creates breathing room, reduces cognitive load
2. **Rounded Corners** - Softens the athletic aesthetic (12-24px standard)
3. **Card-Based Layouts** - Organizes information into digestible chunks
4. **High Contrast** - Ensures readability and accessibility

### Color Principles
1. **Athletic Blue is Primary** - Use for CTAs, key data, active states
2. **Energy Orange is Accent** - Use sparingly for highlights and improvements
3. **Neutral Base** - White/light gray allows color to guide attention
4. **Functional Color** - Color serves purpose, not decoration

### Typography Principles
1. **Large Bold Headlines** - Create impact and establish hierarchy
2. **Clear Hierarchy** - Size and weight differentiation, not color
3. **Readable Body Text** - 18px base with 1.6 line-height
4. **Consistent Family** - Jost throughout maintains visual coherence

### Interaction Principles
1. **Smooth Transitions** - 0.2s creates polish without lag
2. **Clear Feedback** - Hover/active states always visible
3. **Purposeful Motion** - Transitions serve function, not decoration
4. **Accessible Interactions** - Large touch targets, clear states

---

## Usage Guidelines

### DO:
✓ Use 24px spacing between major components
✓ Keep cards at 24px border radius
✓ Use Athletic Blue for primary actions
✓ Use Energy Orange only for highlights/improvements
✓ Maintain generous white space
✓ Use lucide-react icons at 20-24px
✓ Keep data visualizations minimal and clean
✓ Use high-quality athletic photography
✓ Maintain consistent padding (32px in cards)

### DON'T:
✗ Use gradients
✗ Use multiple font families
✗ Overcrowd layouts
✗ Use decorative elements
✗ Use excessive borders or dividing lines
✗ Use complex chart axes
✗ Use emojis in production UI
✗ Mix border radius values inconsistently
✗ Use Energy Orange as a primary color

---

## AI Prompting Template

When prompting AI to generate UI in this style:

```
Create a [component/screen] for Coach Lens using our Modern Athletic Minimalism design system:

FRAMEWORK:
- Material-UI (MUI) v5+ with custom theme
- React functional components with hooks
- Use MUI components as base, customize with sx prop or styled()

VISUAL STYLE:
- Clean card-based layout with 24px rounded corners
- Generous white space: 24px between components, 32px card padding
- Jost font family: Bold for headings, Regular for body (with Roboto fallback)
- High contrast design with white (#FFFFFF) background

COLOR PALETTE:
- Athletic Blue (#2563EB): Primary CTAs, key data, active states
- Energy Orange (#F97316): Sparingly for highlights and improvements only
- Charcoal (#2D2D2D) primary text, Gray (#6B6B6B) secondary text
- Light Gray (#F5F5F5) for subtle backgrounds
- Apply color functionally, not decoratively

MUI COMPONENTS:
- Buttons: MUI Button with borderRadius 12px, textTransform 'none'
- Cards: MUI Card with borderRadius 24px, custom shadow
- Inputs: MUI TextField with outlined variant
- Icons: @mui/icons-material at 20-24px
- Navigation: MUI AppBar, Drawer, ListItemButton
- Feedback: MUI Alert, Snackbar, Dialog

COMPONENTS:
- Large headings: 48-72px Jost Bold with tight letter-spacing
- Buttons: 12px padding, 12px border radius, Athletic Blue fill, sentence case
- Cards: 24px border radius, 32px padding, subtle shadow (0 2px 8px rgba(0,0,0,0.08))
- Icons: MUI icons, 20-24px, colored functionally
- Progress bars: MUI LinearProgress, 8px height, Athletic Blue
- Data visualizations: Recharts library, minimal styling, Athletic Blue

LAYOUT:
- Mobile-first vertical flow
- Clear visual hierarchy through scale and spacing
- Information grouped in logical MUI Cards
- CTAs prominent but not overwhelming
- Maximum container width: 1200px
- Use MUI Grid or Stack for layouts

AVOID:
- Gradients or complex color treatments
- Excessive borders or dividing lines
- Decorative elements
- Multiple font families
- Cluttered layouts
- Emojis
- ALL CAPS text (use sentence case)

SPECIFIC REQUIREMENTS:
[Add your specific requirements here]
```

---

## File Locations

- **design.json** - Programmatic design tokens
- **component-library.jsx** - React component examples
- **design-system.md** - This documentation

---

## Version History

**v2.1.0** - December 17, 2025
- Updated to reflect actual implementation patterns from Dashboard redesign
- Corrected secondary color documentation (Lighter Blue #60A5FA, not Energy Orange)
- Energy Orange now documented as warning color accent
- Added black button variant for high-emphasis CTAs
- Corrected background colors (default: #F5F5F5, paper: #FFFFFF)
- Synchronized design.json and design-system.md with theme.ts implementation
- Verified all Dashboard components match documented patterns

**v2.0.0** - December 12, 2025
- Merged modern athletic minimalism with MUI compatibility
- Updated to Athletic Blue (#2563EB) and Energy Orange (#F97316) palette
- Changed primary font to Jost with Roboto fallback
- Added skeleton overlay system for computer vision feedback
- Added 5-point score color system
- Documented athlete avatar decisions (initials-only for MVP)
- Documented empty state patterns
- Documented error handling strategy
- Added video player control specifications
- Comprehensive MUI theme configuration
- Updated all component specifications for MUI

**v1.0.0** - December 10, 2025 (Original Brain Lift system)
- Initial design system
- Established blue-orange palette with Roboto font
- MUI-focused component library
- Desktop-first approach