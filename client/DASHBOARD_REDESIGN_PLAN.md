# Dashboard Redesign: Component Reorganization Plan

## Target Design Analysis (Image 2)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ MORNING, COACH.                    [ACTIVE ROSTER] [PENDING]   │
│ • System Operational                    24              03/12   │
├─────────────────────────────────────────────────────────────────┤
│ [🎤] Ask CoachAI about athlete performance...  [START ASSESSMENT]│
├─────────────────────────────────────────────────────────────────┤
│ PRIORITY ROSTER    │    TODAY           │    ACTIONS            │
│ (athlete cards)    │  (schedule)        │  (action items)       │
│ - Readiness %      │  - Time slots      │  - Priority badges    │
│ - Activity badges  │  - Event cards     │  - Action buttons     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Reuse Mapping

### ✅ REUSE AS-IS (Minimal Changes)

| Current Component | Target Section | Reuse Strategy |
|------------------|----------------|----------------|
| **ChatInput** | Search bar | ✅ Already perfect - has voice input + text |
| **DashboardHeader** | Greeting section | ✅ Extract greeting logic, remove AI tabs |
| **AthletePickerModal** | Assessment flow | ✅ Keep for "START ASSESSMENT" flow |

### 🔄 REUSE WITH STYLING CHANGES

| Current Component | Target Section | Changes Needed |
|------------------|----------------|----------------|
| **QuickStatsCards** | Top-right stat cards | **MAJOR WIN!** Already exists, just needs:<br>- Display only 2 cards (Active Roster, Pending)<br>- Adjust layout (horizontal vs 4-column)<br>- Update typography to match design |
| **AthletesPanel** | Priority Roster | Restyle athlete items:<br>- Add readiness percentage display<br>- Add activity badges (INJ, ACT, RST)<br>- Remove search (moved to top)<br>- Keep filter chips |
| **QuickActionCards** | START ASSESSMENT button | Extract "New Assessment" card logic<br>- Make standalone button component<br>- Update to lime/yellow-green color (#D4FF00) |

### 🆕 NEW COMPONENTS NEEDED (Minimal)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| **TodaySchedule** | Center column - daily schedule | **Medium** - Create event card layout |
| **ActionsPanel** | Right column - priority actions | **Low** - Can adapt PendingConsentAlerts |

---

## 📋 Incremental Migration Plan (5 Phases)

### **Phase 1: Layout Restructure** ⏱️ 30 min
**Goal:** Change grid from 2-column to 3-column without touching component internals

**Changes:**
- `Dashboard.tsx`: Update Grid layout from `[md:4, md:8]` to `[md:3, md:5, md:4]`
- Keep all existing components rendering in new columns
- Test responsive breakpoints

**Files to Edit:**
- `/Users/claudiaalban/Desktop/ltad-coach/client/src/pages/Dashboard/Dashboard.tsx`

**Validation:** Dashboard still works, just in 3 columns instead of 2

---

### **Phase 2: Header Reorganization** ⏱️ 45 min
**Goal:** Move components to match target: greeting + stats + search + button

**Changes:**
1. **Extract greeting logic from DashboardHeader**
   - Create simple greeting component (just "MORNING, COACH." + status dot)
   - Remove AI tabs (move to separate AI Coach page only)

2. **Add QuickStatsCards to header area**
   - Already exists at `components/QuickStatsCards.tsx`
   - Create wrapper to show only 2 cards: Active Roster, Pending
   - Position in top-right

3. **Move ChatInput to main search bar area**
   - Extract from DashboardHeader
   - Place below stats cards
   - Full width with voice icon

4. **Extract START ASSESSMENT button**
   - Pull from QuickActionCards
   - Make standalone component
   - Update color to lime (#D4FF00)

**Files to Edit:**
- `Dashboard.tsx` (import and arrange new layout)
- `components/DashboardHeader.tsx` (simplify to just greeting)
- `components/QuickStatsCards.tsx` (add prop to filter which cards to show)

**New Files:**
- `components/HeaderStatsCards.tsx` (wrapper for 2-card stats)
- `components/StartAssessmentButton.tsx` (extracted button)

**Validation:** Top section matches target design exactly

---

### **Phase 3: Priority Roster Redesign** ⏱️ 1 hour
**Goal:** Transform AthletesPanel into Priority Roster with readiness metrics

**Changes:**
1. **Add readiness calculation**
   - Placeholder for now (mock 85%, 92%, 98%)
   - Later: integrate with actual assessment data

2. **Add activity badges**
   - INJ (Injured), ACT (Active), RST (Rest)
   - Color-coded chips: red, green, yellow-green

3. **Redesign athlete cards**
   - Current: Avatar + Name + Status badge
   - Target: Avatar + Name + Sport/Event + Readiness bar + Activity badge
   - Larger card footprint, more visual emphasis

4. **Remove inline search**
   - Search moved to top bar
   - Keep filter chips (All, Active, Pending, Declined) → Could become athlete status filters

**Files to Edit:**
- `components/AthletesPanel.tsx`
- Or create new `components/PriorityRoster.tsx` (keep old for safety)

**New Types:**
```typescript
interface AthleteWithReadiness extends Athlete {
  readiness?: number; // 0-100
  activityStatus?: 'active' | 'injured' | 'rest';
  primarySport?: string; // "Sprinter • 100m Dash"
}
```

**Validation:** Left column shows athletes with readiness metrics

---

### **Phase 4: TODAY Schedule (New)** ⏱️ 1.5 hours
**Goal:** Create center column with daily schedule/calendar view

**Design Requirements:**
- Time-based slots (08:00, 10:00, 14:00)
- Event cards with:
  - Event title (e.g., "Morning Huddle", "TEAM SPRINT")
  - Location/room
  - Participant avatars (if applicable)
  - LIVE badge for active events
  - Color-coded (black card for live events)

**Implementation Strategy:**
1. Create `TodaySchedule.tsx` component
2. Define `ScheduleEvent` type:
   ```typescript
   interface ScheduleEvent {
     id: string;
     time: string; // "10:00"
     title: string;
     location?: string;
     duration?: number; // minutes
     participants?: string[]; // athlete IDs
     isLive?: boolean;
   }
   ```
3. For MVP: Use mock/static data
4. Future: Integrate with calendar API

**Files to Create:**
- `components/TodaySchedule.tsx`
- `types/schedule.ts`

**Validation:** Center column shows daily schedule

---

### **Phase 5: ACTIONS Panel** ⏱️ 45 min
**Goal:** Create right column with priority action items

**Design Requirements:**
- Priority badges (HIGH PRIORITY, APPROVAL)
- Action cards with:
  - Title ("Review Jump Metrics")
  - Description
  - Action button ("REVIEW DATA", "APPROVE")
  - Color-coded left border (red for high, lime for approval)
- Red notification dot on section header

**Implementation Strategy:**
1. Check if `PendingConsentAlerts.tsx` can be adapted
2. Or create new `ActionsPanel.tsx`
3. Define action types:
   ```typescript
   interface ActionItem {
     id: string;
     priority: 'high' | 'medium' | 'approval';
     title: string;
     description: string;
     actionLabel: string;
     onAction: () => void;
   }
   ```
4. For MVP: Focus on consent actions + assessment review actions

**Files to Edit/Create:**
- `components/ActionsPanel.tsx` (new or adapt from PendingConsentAlerts)
- `types/actions.ts`

**Validation:** Right column shows prioritized action items

---

## 🎨 Styling Changes Summary

### Color Updates
| Element | Current | Target | Change |
|---------|---------|--------|--------|
| START ASSESSMENT button | Green (#10B981) | Lime (#D4FF00) | Update `success.main` usage to custom lime |
| Activity badges | Status colors | Specific: INJ=red, ACT=green, RST=lime | New badge component |
| LIVE event badge | N/A | Lime (#D4FF00) on black | New style |
| Priority borders | N/A | Red (high), Lime (approval) | New style |

### Typography Updates
- **Greeting:** Larger, bolder ("MORNING, COACH." - all caps, heavy weight)
- **Section headers:** All caps with icon prefix (📊 PRIORITY ROSTER)
- **Stat cards:** Compact, aligned right

### Spacing Updates
- Tighter header area (more compact)
- Full-width search bar with prominent button
- Even 3-column grid with minimal gap

---

## 🔧 Implementation Checklist

### Phase 1: Layout ✓
- [ ] Update `Dashboard.tsx` grid to 3 columns
- [ ] Test responsive breakpoints
- [ ] Verify existing components still render

### Phase 2: Header ✓
- [ ] Simplify `DashboardHeader.tsx` to greeting only
- [ ] Create `HeaderStatsCards.tsx` (2-card wrapper)
- [ ] Extract `StartAssessmentButton.tsx`
- [ ] Position ChatInput as main search bar
- [ ] Style updates (greeting typography, button color)

### Phase 3: Priority Roster ✓
- [ ] Add `readiness` field to athlete type (optional)
- [ ] Add `activityStatus` field to athlete type
- [ ] Create/update `PriorityRoster.tsx` from `AthletesPanel.tsx`
- [ ] Add readiness bar UI
- [ ] Add activity badges (INJ, ACT, RST)
- [ ] Remove inline search, keep filters

### Phase 4: TODAY Schedule ✓
- [ ] Create `types/schedule.ts`
- [ ] Create `TodaySchedule.tsx` component
- [ ] Design event card component
- [ ] Add mock schedule data
- [ ] Implement time slots layout
- [ ] Add LIVE badge logic

### Phase 5: ACTIONS Panel ✓
- [ ] Create `types/actions.ts`
- [ ] Create `ActionsPanel.tsx`
- [ ] Design action card with priority borders
- [ ] Connect to pending consents data
- [ ] Add notification dot on header

### Final Polish ✓
- [ ] Update all section headers (all caps + icons)
- [ ] Verify color consistency with design system
- [ ] Test mobile responsiveness
- [ ] Add skeleton loading states for new components
- [ ] Update tests

---

## 🚀 Quick Start Commands

```bash
# Create new component files
touch client/src/pages/Dashboard/components/HeaderStatsCards.tsx
touch client/src/pages/Dashboard/components/StartAssessmentButton.tsx
touch client/src/pages/Dashboard/components/PriorityRoster.tsx
touch client/src/pages/Dashboard/components/TodaySchedule.tsx
touch client/src/pages/Dashboard/components/ActionsPanel.tsx

# Create new type files
touch client/src/types/schedule.ts
touch client/src/types/actions.ts
```

---

## 📊 Component Reuse Score

| Reused | Restyled | New | Total |
|--------|----------|-----|-------|
| 3 | 3 | 2 | 8 |

**Reuse Rate:** 75% (6 out of 8 components leverage existing code)

---

## 🎯 Success Metrics

After migration, you should have:
1. ✅ **Same functionality** - All existing features work
2. ✅ **New layout** - 3-column design matches target
3. ✅ **Enhanced UX** - Readiness metrics, schedule view, action priorities
4. ✅ **Minimal new code** - Only 2 truly new components (TodaySchedule, ActionsPanel)
5. ✅ **Incremental progress** - Each phase is testable independently

---

## 💡 Key Insights

1. **QuickStatsCards is a goldmine** - Already exists, just needs to be displayed
2. **ChatInput is perfect** - Voice + text input already built
3. **AthletesPanel has 80% of what you need** - Just needs readiness metrics added
4. **TodaySchedule is the only complex new component** - Everything else can be adapted

**Estimated Total Time:** 4-5 hours (vs 15+ hours for full rebuild)
