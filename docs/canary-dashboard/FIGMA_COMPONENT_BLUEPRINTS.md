# Figma Component Blueprints — Enterprise Canary Dashboard

## 🧩 Complete Component Specifications

This document provides detailed blueprints for all reusable components in the Enterprise Canary Dashboard design system.

---

## 1. CanaryStatusBadge

### Component Structure
```
CanaryStatusBadge (Auto-width × 24px)
├── Icon (12×12) [Optional]
└── Label (Auto-width × 12px)
```

### Properties
- **Variant:** `healthy` | `degraded` | `critical` | `unknown`
- **Size:** `sm` (20px height) | `md` (24px height) | `lg` (32px height)
- **ShowIcon:** `true` | `false`

### Variants

#### Healthy
- Background: `success.500` (#22C55E)
- Text: `text.inverse` (#0D1117)
- Icon: 🟢 (12×12px)
- Padding: 4px 12px
- Border Radius: 12px
- Font: Body S, 600

#### Degraded
- Background: `warning.500` (#F59E0B)
- Text: `text.inverse` (#FFFFFF)
- Icon: 🟡 (12×12px)
- Same styling as Healthy

#### Critical
- Background: `danger.500` (#EF4444)
- Text: `text.inverse` (#FFFFFF)
- Icon: 🔴 (12×12px)
- Same styling as Healthy

#### Unknown
- Background: `bg.tertiary` (#1F2937)
- Text: `text.secondary` (#8B949E)
- Icon: ⚪ (12×12px)
- Border: 1px solid `border.subtle`

### States
- **Default:** Normal appearance
- **Hover:** Scale 1.02, slight elevation
- **Active:** 2px `border.focus` ring

### Figma Setup
- Component Name: `CanaryStatusBadge`
- Variants: `Variant=healthy,degraded,critical,unknown` × `Size=sm,md,lg` × `ShowIcon=true,false`
- Auto Layout: Horizontal, 8px gap
- Constraints: Icon fixed, Label flexible

---

## 2. MLDecisionChip

### Component Structure
```
MLDecisionChip (Auto-width × 32px)
├── DecisionLabel (Auto-width × 16px)
└── ConfidenceBadge (Auto-width × 16px) [Optional]
```

### Properties
- **Decision:** `PROMOTE` | `ROLLBACK` | `DEGRADED`
- **Confidence:** Number (0-1)
- **ShowConfidence:** `true` | `false`

### Variants

#### PROMOTE
- Background: `success.500` (#22C55E)
- Text: `text.inverse` (#FFFFFF)
- Icon: ✓ (optional)
- Padding: 6px 16px
- Border Radius: 16px
- Font: Body M, 600

#### ROLLBACK
- Background: `danger.500` (#EF4444)
- Text: `text.inverse` (#FFFFFF)
- Icon: ↻ (optional)
- Same styling as PROMOTE

#### DEGRADED
- Background: `warning.500` (#F59E0B)
- Text: `text.inverse` (#FFFFFF)
- Icon: ⚠ (optional)
- Same styling as PROMOTE

### Confidence Display
- Format: "(87%)" or "(0.87)"
- Font: Body S, 500
- Color: `text.inverse` with 0.9 opacity
- Position: Right side, 8px gap

### States
- **Default:** Normal appearance
- **Hover:** Slight scale 1.02
- **Active:** 2px `border.focus` ring

### Figma Setup
- Component Name: `MLDecisionChip`
- Variants: `Decision=PROMOTE,ROLLBACK,DEGRADED` × `ShowConfidence=true,false`
- Auto Layout: Horizontal, 8px gap
- Constraints: Flexible width

---

## 3. TrafficSplitBar

### Component Structure
```
TrafficSplitBar (400px × 48px)
├── StableBar (Flex-width × 48px)
│   ├── StableLabel (Auto-width × 16px)
│   └── StablePercent (Auto-width × 16px)
└── CanaryBar (Flex-width × 48px)
    ├── CanaryLabel (Auto-width × 16px)
    └── CanaryPercent (Auto-width × 16px)
```

### Properties
- **StablePercent:** Number (0-100)
- **CanaryPercent:** Number (0-100)
- **ShowColors:** `true` | `false`
- **ShowLabels:** `true` | `false`

### Visual Design
- **Stable Bar:**
  - Background: `traffic.stable` (#3B82F6)
  - Width: Calculated from `StablePercent`
  - Text: `text.inverse` (#FFFFFF)
  - Font: Body S, 600

- **Canary Bar:**
  - Background: `traffic.canary` (#A855F7)
  - Width: Calculated from `CanaryPercent`
  - Text: `text.inverse` (#FFFFFF)
  - Font: Body S, 600

- **Container:**
  - Background: `bg.subtle` (#0F1419)
  - Border Radius: 6px
  - Height: 48px
  - Padding: 0px

### Layout
- Horizontal flex container
- Bars fill proportionally
- Labels centered in each bar
- Percent shown as "90%" or "10%"

### States
- **Default:** Normal appearance
- **Hover:** Slight elevation, tooltip shows exact percentages

### Figma Setup
- Component Name: `TrafficSplitBar`
- Variants: `ShowColors=true,false` × `ShowLabels=true,false`
- Auto Layout: Horizontal, 0px gap
- Constraints: Flexible width, fixed height

---

## 4. MetricCard

### Component Structure
```
MetricCard (400px × 200px)
├── Header (400px × 32px)
│   ├── Title (Flex-width × 24px)
│   └── Icon (24×24) [Optional]
├── Value (400px × 48px)
│   └── MetricValue (Auto-width × 48px)
├── ChangeIndicator (400px × 24px) [Optional]
│   └── ChangeText (Auto-width × 16px)
└── Footer (400px × 96px)
    └── ChartMini (400px × 72px) [Optional]
```

### Properties
- **Title:** String
- **Value:** String | Number
- **Change:** Number (positive/negative)
- **ShowChart:** `true` | `false`
- **ChartType:** `line` | `bar` | `none`

### Variants

#### Default Card
- Background: `bg.secondary` (#161B22)
- Border: 1px solid `border.subtle` (#21262D)
- Border Radius: 8px
- Padding: 24px
- Shadow: None

#### Hover State
- Shadow: `cardHover` (0 4px 12px rgba(0,0,0,0.15))
- Background: Slightly lighter

### Typography
- **Title:** H6 (14px, 600, `text.secondary`)
- **Value:** H2 (24px, 600, `text.primary`)
- **Change:** Body S (12px, 500, `success.500` or `danger.500`)

### Change Indicator
- Positive: Green arrow ↑, `success.500`
- Negative: Red arrow ↓, `danger.500`
- Format: "+5.2%" or "-2.1%"

### Figma Setup
- Component Name: `MetricCard`
- Variants: `ShowChart=true,false` × `ChartType=line,bar,none`
- Auto Layout: Vertical, 16px gap
- Constraints: Fixed width 400px, flexible height

---

## 5. ErrorRateChart

### Component Structure
```
ErrorRateChart (680px × 400px)
├── Header (680px × 32px)
│   └── Title (Auto-width × 24px) "Error Rate"
├── ChartArea (680px × 336px)
│   ├── YAxis (40px × 336px)
│   ├── XAxis (640px × 40px)
│   └── ChartBars (640px × 296px)
│       └── BarSeries (640px × 296px)
└── Legend (680px × 32px) [Optional]
    └── LegendItems (Auto-width × 24px)
```

### Properties
- **Data:** Array of {timestamp, errorRate}
- **Threshold:** Number (default 0.05)
- **ShowThreshold:** `true` | `false`
- **TimeRange:** `1h` | `6h` | `24h` | `7d`

### Visual Design
- **Bars:**
  - Color: `chart.red` (#EF4444)
  - Width: Calculated from data points
  - Height: Proportional to error rate
  - Border Radius: 2px (top corners)

- **Threshold Line:**
  - Color: `warning.500` (#F59E0B)
  - Style: Dashed, 2px
  - Label: "5% threshold"

- **Grid:**
  - Lines: `border.subtle` (#21262D)
  - Style: 1px solid
  - Spacing: 20% increments

- **Axes:**
  - Labels: `text.secondary` (#8B949E)
  - Font: Body S (12px)
  - X-Axis: Time format (HH:MM)
  - Y-Axis: Percentage (0-1 or 0-100%)

### States
- **Default:** Normal chart display
- **Hover:** Tooltip shows exact value
- **Selected:** Bar highlighted with `border.focus`

### Figma Setup
- Component Name: `ErrorRateChart`
- Variants: `ShowThreshold=true,false` × `TimeRange=1h,6h,24h,7d`
- Auto Layout: Vertical, 8px gap
- Constraints: Fixed dimensions, responsive to container

---

## 6. LatencyChart

### Component Structure
```
LatencyChart (680px × 400px)
├── Header (680px × 32px)
│   └── Title (Auto-width × 24px) "Latency Trend (P50/P90/P99)"
├── ChartArea (680px × 336px)
│   ├── YAxis (40px × 336px)
│   ├── XAxis (640px × 40px)
│   └── LineSeries (640px × 296px)
│       ├── P50Line (640px × 296px)
│       ├── P90Line (640px × 296px)
│       └── P99Line (640px × 296px)
└── Legend (680px × 32px)
    ├── P50Legend (Auto-width × 24px)
    ├── P90Legend (Auto-width × 24px)
    └── P99Legend (Auto-width × 24px)
```

### Properties
- **Data:** Array of {timestamp, p50, p90, p99}
- **TimeRange:** `1h` | `6h` | `24h` | `7d`
- **ShowLegend:** `true` | `false`

### Visual Design
- **P50 Line:**
  - Color: `chart.blue` (#3B82F6)
  - Width: 2px
  - Style: Solid
  - Label: "P50"

- **P90 Line:**
  - Color: `chart.purple` (#A855F7)
  - Width: 2px
  - Style: Solid
  - Label: "P90"

- **P99 Line:**
  - Color: `chart.orange` (#F97316)
  - Width: 2px
  - Style: Solid
  - Label: "P99"

- **Grid:**
  - Lines: `border.subtle` (#21262D)
  - Style: 1px solid
  - Spacing: 20% increments

- **Axes:**
  - Labels: `text.secondary` (#8B949E)
  - Font: Body S (12px)
  - X-Axis: Time format (HH:MM)
  - Y-Axis: Milliseconds (ms)

### Legend
- Format: Colored dot + Label
- Spacing: 24px between items
- Font: Body S (12px, 500)

### States
- **Default:** Normal chart display
- **Hover:** Tooltip shows all 3 values at timestamp
- **Selected:** Point highlighted with `border.focus`

### Figma Setup
- Component Name: `LatencyChart`
- Variants: `TimeRange=1h,6h,24h,7d` × `ShowLegend=true,false`
- Auto Layout: Vertical, 8px gap
- Constraints: Fixed dimensions, responsive to container

---

## 7. WorkerRevisionCard

### Component Structure
```
WorkerRevisionCard (400px × 200px)
├── Header (400px × 32px)
│   ├── WorkerName (Flex-width × 24px)
│   └── StatusBadge (Auto-width × 24px)
├── RevisionInfo (400px × 80px)
│   ├── StableRevision (400px × 40px)
│   │   ├── Label (80px × 16px) "Stable:"
│   │   └── RevisionTag (320px × 24px)
│   └── CanaryRevision (400px × 40px)
│       ├── Label (80px × 16px) "Canary:"
│       └── RevisionTag (320px × 24px)
└── TrafficSplit (400px × 88px)
    └── TrafficSplitBar (400px × 48px)
```

### Properties
- **WorkerName:** String
- **StableRevision:** String
- **CanaryRevision:** String
- **StablePercent:** Number (0-100)
- **CanaryPercent:** Number (0-100)
- **Status:** `healthy` | `degraded` | `critical`

### Visual Design
- Background: `bg.secondary` (#161B22)
- Border: 1px solid `border.subtle` (#21262D)
- Border Radius: 8px
- Padding: 24px

### Typography
- **WorkerName:** H5 (16px, 600, `text.primary`)
- **Label:** Body S (12px, 500, `text.secondary`)
- **RevisionTag:** Body M (14px, 400, `text.primary`, Mono font)

### Revision Tag
- Background: `bg.tertiary` (#1F2937)
- Border: 1px solid `border.subtle`
- Border Radius: 6px
- Padding: 6px 12px
- Font: JetBrains Mono, 12px
- Truncate: Yes (with ellipsis)

### States
- **Default:** Normal appearance
- **Hover:** Shadow `cardHover`, cursor pointer
- **Active:** 2px `border.focus` ring

### Figma Setup
- Component Name: `WorkerRevisionCard`
- Variants: `Status=healthy,degraded,critical`
- Auto Layout: Vertical, 16px gap
- Constraints: Fixed width 400px, flexible height

---

## 8. LogsTable

### Component Structure
```
LogsTable (1392px × 400px)
├── Header (1392px × 48px)
│   ├── SearchInput (400px × 40px)
│   ├── FilterDropdown (120px × 40px)
│   ├── ExportButton (100px × 40px)
│   └── ClearButton (100px × 40px)
├── TableHeader (1392px × 48px)
│   ├── TimeColumn (200px × 48px) "Time"
│   ├── LevelColumn (120px × 48px) "Level"
│   └── MessageColumn (1072px × 48px) "Message"
└── TableBody (1392px × 304px)
    └── LogRows (1392px × Auto-height)
        └── LogRow (1392px × 48px) [Repeatable]
            ├── TimeCell (200px × 48px)
            ├── LevelCell (120px × 48px)
            └── MessageCell (1072px × 48px)
```

### Properties
- **Logs:** Array of {timestamp, level, message}
- **Searchable:** `true` | `false`
- **Filterable:** `true` | `false`
- **Sortable:** `true` | `false`
- **AutoScroll:** `true` | `false`
- **MaxRows:** Number (default 1000)

### Visual Design
- **Table Header:**
  - Background: `bg.subtle` (#0F1419)
  - Border: 1px solid `border.subtle` (#21262D)
  - Font: Body S (12px, 600, `text.secondary`)
  - Padding: 12px 16px

- **Table Row:**
  - Height: 48px
  - Background: Transparent
  - Border: 1px solid `border.subtle` (bottom only)
  - Padding: 12px 16px
  - Font: Mono M (12px, 400)

- **Row Hover:**
  - Background: `bg.hover` (#1C2128)

- **Level Colors:**
  - INFO: `text.secondary` (#8B949E)
  - WARN: `warning.500` (#F59E0B)
  - ERROR: `danger.500` (#EF4444)
  - DEBUG: `text.muted` (#6E7681)

### Search Input
- Background: `bg.tertiary` (#1F2937)
- Border: 1px solid `border.subtle`
- Border Radius: 6px
- Padding: 8px 12px
- Placeholder: "Search logs..."
- Font: Body M (14px)

### Filter Dropdown
- Same styling as Search Input
- Options: All, INFO, WARN, ERROR, DEBUG

### States
- **Default:** Normal table display
- **Hover:** Row highlighted
- **Selected:** Row with `border.focus` ring
- **Loading:** Skeleton rows

### Figma Setup
- Component Name: `LogsTable`
- Variants: `Searchable=true,false` × `Filterable=true,false` × `AutoScroll=true,false`
- Auto Layout: Vertical, 0px gap
- Constraints: Flexible width, fixed row height

---

## 📋 Component Assembly Checklist

### Step 1: Create Base Components
- [ ] Create CanaryStatusBadge with all variants
- [ ] Create MLDecisionChip with all variants
- [ ] Create TrafficSplitBar with all variants
- [ ] Create MetricCard with all variants
- [ ] Create ErrorRateChart placeholder
- [ ] Create LatencyChart placeholder
- [ ] Create WorkerRevisionCard with all variants
- [ ] Create LogsTable with all variants

### Step 2: Link Design Tokens
- [ ] Link all colors to color tokens
- [ ] Link all typography to text styles
- [ ] Link all spacing to spacing tokens
- [ ] Link all border radius to radius tokens

### Step 3: Set Up Variants
- [ ] Configure variant properties
- [ ] Test variant switching
- [ ] Verify all states (default, hover, active)

### Step 4: Create Component Instances
- [ ] Test components in frames
- [ ] Verify constraints work correctly
- [ ] Test responsive behavior

### Step 5: Document Components
- [ ] Add component descriptions
- [ ] Document property usage
- [ ] Create usage examples

---

**Status:** ✅ Complete Component Blueprints Generated
**Ready for:** Figma component creation and variant setup
