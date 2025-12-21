# Apify Kill Switches - UI Behavior Specification

**Status**: UI-Only (No Backend Logic)
**Component**: `ApifyKillSwitches.tsx`
**Location**: Admin Dashboard `/admin/dashboard`

---

## Overview

Emergency controls for pausing Apify scraping operations. Currently **UI-only** with no actual scraping control. Backend integration required for functionality.

---

## Kill Switches

### 1. Pause All Apify Scrapes

**Danger Level**: CRITICAL 🔴

**Copy**:
- **Label**: "Pause All Apify Scrapes"
- **Description**: "Immediately halt all Apify scraping operations across all marketplaces and regions."
- **Warning**: "This will stop ALL data collection. No new deals will be discovered until scraping is resumed. Existing saved searches will not receive updates."

**Visual States**:
- **Inactive**: Gray toggle, white background, subtle border
- **Active**: Red toggle, red-tinted background, red border, "ACTIVE" badge

**Behavior**:
1. User clicks toggle → Confirmation dialog appears
2. Dialog shows impact warning with red background
3. User confirms → Toggle switches to red, "ACTIVE" badge appears
4. Warning message displays below toggle
5. Console logs action (UI demo only)

---

### 2. Pause Elite Pools Only

**Danger Level**: HIGH 🟠

**Copy**:
- **Label**: "Pause Elite Pools Only"
- **Description**: "Pause high-value marketplace pools (Facebook, eBay) to reduce burn rate while maintaining standard pools."
- **Warning**: "Elite pools (Facebook, eBay) will stop scraping. Users tracking these marketplaces will not receive new alerts until resumed."

**Visual States**:
- **Inactive**: Gray toggle, white background, subtle border
- **Active**: Orange toggle, orange-tinted background, orange border, "ACTIVE" badge

**Behavior**:
1. Same confirmation flow as #1
2. Orange color scheme instead of red
3. Less severe warning messaging

---

### 3. Pause Pools Exceeding Budget

**Danger Level**: MEDIUM 🟡

**Copy**:
- **Label**: "Pause Pools Exceeding $X/day"
- **Description**: "Automatically pause any pool that exceeds $X in daily Apify costs to prevent runaway spending."
- **Warning**: "Pools exceeding the daily budget threshold will be paused automatically. This may impact data freshness for high-volume marketplaces."

**Visual States**:
- **Inactive**: Gray toggle, white background, subtle border
- **Active**: Yellow toggle, yellow-tinted background, yellow border, "ACTIVE" badge
- **Additional UI**: Budget threshold input field (number input, $1-$500)

**Behavior**:
1. Same confirmation flow as #1
2. Yellow color scheme
3. Budget threshold input updates in real-time
4. Input is editable while switch is active

---

## UI Behavior Specification

### Confirmation Dialog

**Trigger**: Enabling any kill switch

**Dialog Structure**:
```
┌─────────────────────────────────────┐
│               ⚠️                    │
│   Confirm Kill Switch Activation    │
│                                     │
│  You are about to activate:         │
│  [Switch Name] (in red)             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Impact: [Warning Message]     │  │ (red background)
│  └───────────────────────────────┘  │
│                                     │
│  This action will take effect       │
│  immediately. Are you sure?         │
│                                     │
│  [Cancel]  [Confirm Activation]     │
│                                     │
└─────────────────────────────────────┘
```

**Colors**:
- Background: `#1a1a1a` (dark surface)
- Border: Red `border-red-500/30`
- Warning box: Red background `bg-red-500/10`, red border
- Confirm button: Red background `bg-red-500`, white text
- Cancel button: Gray background `bg-[#2a2a2a]`, white text

---

### Visual Hierarchy

**Priority Order** (top to bottom):
1. **Pause All** - Most dangerous, most prominent, red
2. **Pause Elite Pools** - High risk, orange
3. **Pause Budget-Exceeded** - Medium risk, yellow, includes input

**Visual Cues**:
- Danger badges: "CRITICAL" for #1
- Active badges: "ACTIVE" when enabled
- Color-coded borders and backgrounds
- Warning icons: ⚠️

---

## Copy Text

### Header

```
🚨 Apify Kill Switches
[Badge: UI ONLY - NO LOGIC YET]

Emergency controls for Apify scraping operations • Requires explicit confirmation
```

### Warning Notice (Footer)

```
ℹ️ UI-Only Demo Mode

These kill switches are visual only and do not currently affect Apify scraping.
Backend integration is required to implement actual pause functionality. Toggles
will log to console for testing purposes.
```

---

## Color Scheme

### Critical (Pause All)
```css
Border: border-red-500/30
Background (inactive): bg-[#0a0a0a]
Background (active): bg-red-500/5
Badge: bg-red-500/20 text-red-400 border-red-500/30
Toggle (active): bg-red-500
Active Border: border-red-500
```

### High (Pause Elite)
```css
Border: border-orange-500/30
Background (inactive): bg-[#0a0a0a]
Background (active): bg-orange-500/5
Badge: bg-orange-500/20 text-orange-400 border-orange-500/30
Toggle (active): bg-orange-500
Active Border: border-orange-500
```

### Medium (Budget Threshold)
```css
Border: border-yellow-500/30
Background (inactive): bg-[#0a0a0a]
Background (active): bg-yellow-500/5
Badge: bg-yellow-500/20 text-yellow-400 border-yellow-500/30
Toggle (active): bg-yellow-500
Active Border: border-yellow-500
```

### Inactive State
```css
Toggle: bg-[#2a2a2a]
Border: border-[#2a2a2a]
Background: bg-[#0a0a0a]
```

---

## Interaction States

### Toggle Switch

**Inactive State**:
- Background: Gray (`bg-[#2a2a2a]`)
- Knob position: Left (`translate-x-1`)
- Border: Subtle gray

**Active State**:
- Background: Danger color (red/orange/yellow)
- Knob position: Right (`translate-x-6`)
- Border: Danger color (prominent)

**Hover**:
- Opacity: 80% (`hover:opacity-80`)

**Transition**:
- All properties: Smooth transition (`transition-colors`, `transition-transform`)

---

## Accessibility

### ARIA Labels
```tsx
<button
  aria-label="Toggle Pause All Apify Scrapes"
  role="switch"
  aria-checked={killSwitch.enabled}
>
```

### Keyboard Navigation
- Tab to focus toggle
- Space/Enter to activate
- Escape to cancel confirmation dialog

### Screen Reader Support
- Toggle state announced
- Warning messages read aloud
- Confirmation dialog focus trapped

---

## Backend Integration Required

**Current State**: UI logs to console only

**Required Implementation**:
1. API endpoint: `POST /api/admin/apify/kill-switch`
2. Request body:
   ```json
   {
     "switchId": "pause_all",
     "enabled": true,
     "budgetThreshold": 50  // For budget-based switch
   }
   ```
3. Worker-scheduler checks flags before each run
4. Database table: `apify_kill_switches` or use existing `admin_controls`

**Integration Points**:
- Line 239: `console.log(...)` → Replace with API call
- Success/error handling
- Optimistic UI updates
- Real-time status sync

---

## Testing Checklist

**Visual**:
- [ ] All three switches render correctly
- [ ] Color schemes match danger levels
- [ ] Inactive/active states display properly
- [ ] Budget input shows for #3 only

**Interaction**:
- [ ] Clicking toggle shows confirmation
- [ ] Confirming enables switch
- [ ] Canceling does nothing
- [ ] Disabling doesn't require confirmation

**Accessibility**:
- [ ] Keyboard navigation works
- [ ] Screen reader announces state changes
- [ ] Focus management in dialog

**Edge Cases**:
- [ ] Multiple rapid clicks handled
- [ ] Invalid budget threshold rejected
- [ ] Console logs appear (UI demo)

---

## Future Enhancements

**Phase 2** (Backend Integration):
- Connect to API endpoints
- Real-time status polling
- Worker-scheduler integration
- Audit logging

**Phase 3** (Advanced Features):
- Scheduled enable/disable
- Budget alerts (email when threshold hit)
- Per-marketplace granular controls
- Historical pause events log

---

## Design Rationale

### Why Confirmation Required?

Kill switches are **destructive operations** that immediately stop data collection. Confirmation prevents:
- Accidental activation
- Mis-clicks
- User error
- Production incidents

### Why Color-Coded Danger Levels?

Visual hierarchy guides admins to understand **impact severity**:
- **Red (Critical)**: Stops everything
- **Orange (High)**: Stops subset (elite pools)
- **Yellow (Medium)**: Automated threshold-based

### Why UI-Only First?

Allows:
- UI/UX testing without backend risk
- Design iteration
- Copy refinement
- Visual polish

Before implementing actual pause logic that could break production scraping.

---

**Last Updated**: 2024-12-21
**Status**: ✅ UI Complete, Backend Integration Pending
**Component**: `ApifyKillSwitches.tsx`
