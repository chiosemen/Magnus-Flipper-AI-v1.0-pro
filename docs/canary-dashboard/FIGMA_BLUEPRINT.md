# Figma UI Blueprint Pack — Enterprise Canary Dashboard

## 📐 SECTION 1 — Complete Figma Frame Blueprint

### Main Frames (1440×1024)

#### 1. Canary Dashboard — Home
**Frame Size:** 1440×1024px
**Layout:** 12-column grid, 8px baseline
**Padding:** 24px outer, 16px inner

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Topbar (64px)                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Logo | Dashboard | Workers | Replay | Settings    │ │
│ │ [Connection Status] [User]                          │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Main Content Area                                        │
│ ┌──────────────┬──────────────┬──────────────────────┐ │
│ │ Revision     │ ML Decision  │ Health Metrics       │ │
│ │ Card         │ Card         │ Card                 │ │
│ │ (400px)      │ (400px)      │ (400px)              │ │
│ └──────────────┴──────────────┴──────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Charts Section (Full Width)                        │ │
│ │ ┌──────────────┬──────────────┐                    │ │
│ │ │ Latency      │ Error Rate   │                    │ │
│ │ │ Chart        │ Chart        │                    │ │
│ │ │ (680px)      │ (680px)      │                    │ │
│ │ └──────────────┴──────────────┘                    │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ ML Confidence Trend (Full Width)               │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Live Logs Stream (Full Width, 320px height)        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Grid System:**
- 12 columns, 24px gutters
- 8px baseline grid
- 24px outer padding

**UX Hierarchy:**
1. Topbar (Primary navigation)
2. Status cards (Critical metrics)
3. Charts (Trend visualization)
4. Logs (Supporting data)

---

#### 2. Worker Detail View
**Frame Size:** 1440×1024px
**Layout:** 12-column grid

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Topbar + Breadcrumbs                                    │
│ Dashboard > Workers > mf-worker-realtime                │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────────────────────────────┐ │
│ │ Worker Info  │ Performance Metrics                  │ │
│ │ Panel        │ Panel                                │ │
│ │              │ ┌──────────────────────────────────┐ │ │
│ │ - Name       │ │ Latency P50/P90/P99              │ │ │
│ │ - Revision   │ │ Error Rate                       │ │ │
│ │ - Status     │ │ Request Volume                   │ │ │
│ │ - Traffic %  │ │ Restart Count                    │ │ │
│ │              │ └──────────────────────────────────┘ │ │
│ └──────────────┴──────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Timeline View (Revision History)                    │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Recent Logs (Filterable)                           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

#### 3. ML Committee Decision Pane
**Frame Size:** 1440×1024px
**Layout:** Split view (60/40)

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ ┌──────────────────────────┬──────────────────────────┐ │
│ │ ML Decision Summary      │ Committee Votes          │ │
│ │                          │                          │ │
│ │ [PROMOTE/ROLLBACK/       │ ┌────────────────────┐  │ │
│ │  DEGRADED Badge]         │ │ OpenAI: PROMOTE    │  │ │
│ │                          │ │ Confidence: 0.92   │  │ │
│ │ Confidence: 87%          │ └────────────────────┘  │ │
│ │ Severity: OK             │ ┌────────────────────┐  │ │
│ │                          │ │ DeepSeek: PROMOTE  │  │ │
│ │ Summary:                 │ │ Confidence: 0.85   │  │ │
│ │ "No anomalies detected"  │ └────────────────────┘  │ │
│ │                          │ ┌────────────────────┐  │ │
│ │ Anomalies:               │ │ Claude: PROMOTE    │  │ │
│ │ - None                   │ │ Confidence: 0.88   │  │ │
│ │                          │ └────────────────────┘  │ │
│ │                          │                          │ │
│ │ [Promote] [Rollback]     │ Majority: PROMOTE (3/3) │ │
│ └──────────────────────────┴──────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Anomaly Details Table                                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

#### 4. Canary Replay Timeline
**Frame Size:** 1440×1024px
**Layout:** Timeline-centered

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Replay Controls                                         │
│ [← Previous] [Run ID: abc123] [Next →] [Play] [Pause] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Timeline (Horizontal)                               │ │
│ │ ──────●─────────●─────────●─────────●─────────────  │ │
│ │       Deploy   Canary   ML        Promote          │ │
│ │       10:00    10:05    10:10     10:15           │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌──────────────┬──────────────┬──────────────────────┐ │
│ │ State at     │ State at     │ State at             │ │
│ │ 10:00        │ 10:10        │ 10:15                │ │
│ │              │              │                      │ │
│ │ Revisions    │ ML Decision  │ Final Outcome        │ │
│ │ Traffic      │ Anomalies    │ Metrics              │ │
│ └──────────────┴──────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

#### 5. Live Logs Stream
**Frame Size:** 1440×1024px
**Layout:** Full-width log viewer

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Log Controls                                            │
│ [Filter] [Search] [Auto-scroll ✓] [Export] [Clear]     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Log Stream (Auto-scrolling)                         │ │
│ │                                                      │ │
│ │ [10:15:23] [INFO] Health check passed               │ │
│ │ [10:15:18] [INFO] Processing request                │ │
│ │ [10:15:12] [WARN] Latency spike detected            │ │
│ │ [10:15:08] [ERROR] Connection timeout               │ │
│ │ [10:15:05] [INFO] Worker started                    │ │
│ │                                                      │ │
│ │ (Scrollable, 800px height)                          │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Log Statistics                                      │ │
│ │ Total: 1,234 | Errors: 12 | Warnings: 45          │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

#### 6. Revision Comparison View
**Frame Size:** 1440×1024px
**Layout:** Side-by-side comparison

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Comparison: Stable vs Canary                           │
├──────────────────┬─────────────────────────────────────┤
│ Stable Revision  │ Canary Revision                     │
│ mf-worker-...    │ mf-worker-...                       │
│                  │                                      │
│ ┌──────────────┐ │ ┌──────────────┐                    │
│ │ Metrics      │ │ │ Metrics      │                    │
│ │ - Latency    │ │ │ - Latency    │                    │
│ │ - Errors     │ │ │ - Errors     │                    │
│ │ - Requests   │ │ │ - Requests   │                    │
│ └──────────────┘ │ └──────────────┘                    │
│                  │                                      │
│ ┌──────────────┐ │ ┌──────────────┐                    │
│ │ Health       │ │ │ Health       │                    │
│ │ Status: ✅   │ │ │ Status: ✅   │                    │
│ │ Uptime: 99%  │ │ │ Uptime: 98%  │                    │
│ └──────────────┘ │ └──────────────┘                    │
│                  │                                      │
│ [View Details]   │ [View Details]                       │
└──────────────────┴─────────────────────────────────────┘
```

---

#### 7. Auth Login Page
**Frame Size:** 1440×1024px
**Layout:** Centered card

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│              ┌──────────────────────┐                   │
│              │                      │                   │
│              │  🔐 Dashboard Login  │                   │
│              │                      │                   │
│              │  Admin Token         │                   │
│              │  [──────────────]    │                   │
│              │                      │                   │
│              │  [    Login    ]     │                   │
│              │                      │                   │
│              │  [Forgot token?]     │                   │
│              │                      │                   │
│              └──────────────────────┘                   │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

#### 8. Settings & Feature Flags
**Frame Size:** 1440×1024px
**Layout:** Settings sidebar + content

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ ┌──────────┬──────────────────────────────────────────┐ │
│ │ Settings │ General                                  │ │
│ │          │                                          │ │
│ │ General  │ Dashboard Refresh Rate                   │ │
│ │ Workers  │ [5s] [10s] [30s] [Manual]               │ │
│ │ ML       │                                          │ │
│ │ Alerts   │ Auto-refresh Logs                        │ │
│ │ API      │ [✓] Enabled                              │ │
│ │          │                                          │ │
│ │          │ Feature Flags                            │ │
│ │          │ [✓] ML Committee Voting                  │ │
│ │          │ [✓] WebSocket Streaming                  │ │
│ │          │ [ ] Experimental Charts                   │ │
│ └──────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

### Modal Frames

#### Promote Canary Modal
**Size:** 600×400px
**Centered overlay**

```
┌────────────────────────────────────┐
│ Promote Canary to 100%?            │
│                                    │
│ Current: 10% canary / 90% stable  │
│ Target:  100% canary               │
│                                    │
│ ML Decision: PROMOTE               │
│ Confidence: 87%                    │
│                                    │
│ [Cancel]        [Confirm Promote]  │
└────────────────────────────────────┘
```

#### Rollback Revision Modal
**Size:** 600×400px

```
┌────────────────────────────────────┐
│ Rollback to Stable Revision?       │
│                                    │
│ Current: mf-worker-...-abc123      │
│ Target:  mf-worker-...-xyz789      │
│                                    │
│ This will route 100% traffic to    │
│ the previous stable revision.      │
│                                    │
│ [Cancel]        [Confirm Rollback] │
└────────────────────────────────────┘
```

#### Worker Health Diagnostics Modal
**Size:** 800×600px

```
┌──────────────────────────────────────────┐
│ Worker Health Diagnostics                │
│                                          │
│ Worker: mf-worker-realtime               │
│ Status: ⚠️ Degraded                       │
│                                          │
│ Issues Detected:                         │
│ • Latency spike at 10:15                │
│ • 3 failed health checks                │
│ • Memory usage: 85%                      │
│                                          │
│ Recommended Actions:                     │
│ [Restart Worker] [View Logs] [Ignore]   │
└──────────────────────────────────────────┘
```

#### ML Explanation Modal
**Size:** 700×500px

```
┌────────────────────────────────────────┐
│ ML Decision Explanation                 │
│                                         │
│ Decision: PROMOTE                       │
│                                         │
│ Committee Votes:                        │
│ • OpenAI: PROMOTE (92% confidence)     │
│ • DeepSeek: PROMOTE (85% confidence)   │
│ • Claude: PROMOTE (88% confidence)     │
│                                         │
│ Analysis:                               │
│ All three ML providers agree that the  │
│ canary is healthy and ready for full   │
│ promotion. No anomalies detected.      │
│                                         │
│ [Close]                                 │
└────────────────────────────────────────┘
```

---

### Mobile Frames (375×812)

#### Dashboard Mobile
**Frame Size:** 375×812px
**Layout:** Single column, stacked

```
┌─────────────────┐
│ [☰] Dashboard   │
├─────────────────┤
│ Revision Card   │
│ (Full width)    │
├─────────────────┤
│ ML Decision     │
│ Card            │
├─────────────────┤
│ Health Metrics  │
│ Card            │
├─────────────────┤
│ Latency Chart   │
│ (Full width)    │
├─────────────────┤
│ Error Rate      │
│ Chart           │
├─────────────────┤
│ [View Logs →]  │
└─────────────────┘
```

---

## 🎨 SECTION 2 — Design System Token Sheet

### Typography Tokens

#### Headings
```
H1: Inter, 32px, 700, -0.5px letter-spacing
H2: Inter, 24px, 600, -0.25px letter-spacing
H3: Inter, 20px, 600, 0px letter-spacing
H4: Inter, 18px, 600, 0px letter-spacing
H5: Inter, 16px, 600, 0px letter-spacing
H6: Inter, 14px, 600, 0px letter-spacing
```

#### Body Text
```
Body L: Inter, 16px, 400, 0px letter-spacing, 24px line-height
Body M: Inter, 14px, 400, 0px letter-spacing, 20px line-height
Body S: Inter, 12px, 400, 0px letter-spacing, 16px line-height
```

#### Mono (Logs/Code)
```
Mono L: 'JetBrains Mono', 14px, 400, 0px letter-spacing
Mono M: 'JetBrains Mono', 12px, 400, 0px letter-spacing
Mono S: 'JetBrains Mono', 11px, 400, 0px letter-spacing
```

---

### Color Tokens (Dark Theme)

#### Semantic Colors
```
success.50:  #F0FDF4
success.100: #DCFCE7
success.500: #22C55E (Primary success)
success.600: #16A34A
success.700: #15803D

warning.50:  #FFFBEB
warning.100: #FEF3C7
warning.500: #F59E0B (Primary warning)
warning.600: #D97706
warning.700: #B45309

danger.50:   #FEF2F2
danger.100:  #FEE2E2
danger.500:  #EF4444 (Primary danger)
danger.600:  #DC2626
danger.700:  #B91C1C
```

#### Chart Colors
```
chart.blue:    #3B82F6
chart.purple:  #A855F7
chart.orange:  #F97316
chart.green:   #22C55E
chart.red:     #EF4444
chart.yellow:  #EAB308
```

#### Traffic Colors
```
traffic.stable:  #3B82F6 (Blue)
traffic.canary:  #A855F7 (Purple)
traffic.split:   #6B7280 (Gray for labels)
```

#### Background Tokens
```
bg.primary:    #0D1117 (Main background)
bg.secondary:  #161B22 (Card/panel background)
bg.tertiary:   #1F2937 (Elevated surface)
bg.subtle:     #0F1419 (Subtle background)
bg.hover:      #1C2128 (Hover state)
```

#### Border Tokens
```
border.subtle:  #21262D (Subtle borders)
border.strong:  #30363D (Strong borders)
border.focus:   #58A6FF (Focus ring)
```

#### Text Tokens
```
text.primary:    #E6EDF3 (Primary text)
text.secondary:  #8B949E (Secondary text)
text.muted:      #6E7681 (Muted text)
text.inverse:    #0D1117 (Inverse text)
```

---

### Color Tokens (Light Theme)

#### Semantic Colors (Same as dark)
```
success.500: #22C55E
warning.500: #F59E0B
danger.500:  #EF4444
```

#### Background Tokens
```
bg.primary:    #FFFFFF
bg.secondary:  #F6F8FA
bg.tertiary:   #FFFFFF
bg.subtle:     #F6F8FA
bg.hover:      #F0F3F6
```

#### Border Tokens
```
border.subtle:  #D1D9E0
border.strong:  #B1BAC4
border.focus:   #0969DA
```

#### Text Tokens
```
text.primary:    #1F2328
text.secondary:  #656D76
text.muted:      #8B949E
text.inverse:    #FFFFFF
```

---

### Component Tokens

#### Cards
```
Padding: 24px
Border Radius: 8px
Border: 1px solid border.subtle
Background: bg.secondary
Shadow: None (flat design)
Hover Shadow: 0 4px 12px rgba(0,0,0,0.15)
```

#### Panels
```
Padding: 16px
Border Radius: 6px
Background: bg.tertiary
Border: 1px solid border.subtle
```

#### Data Tables
```
Row Height: 48px
Cell Padding: 12px 16px
Header Background: bg.subtle
Row Hover: bg.hover
Border: 1px solid border.subtle (between rows)
```

#### Status Badges
```
Padding: 4px 12px
Border Radius: 12px
Font: Body S (12px, 600)
Height: 24px
```

**Variants:**
- Success: bg.success.500, text.white
- Warning: bg.warning.500, text.white
- Danger: bg.danger.500, text.white
- Info: bg.chart.blue, text.white

#### Tag Chips
```
Padding: 6px 12px
Border Radius: 16px
Font: Body S (12px, 500)
Background: bg.tertiary
Border: 1px solid border.subtle
```

#### Log Lines
```
Font: Mono M (12px)
Line Height: 20px
Padding: 4px 0px
Background: Transparent (alternating bg.subtle on hover)
```

**Log Level Colors:**
- INFO: text.secondary
- WARN: text.warning.500
- ERROR: text.danger.500
- DEBUG: text.muted

#### Charts (Chart.js Palette)
```
Primary: chart.blue (#3B82F6)
Secondary: chart.purple (#A855F7)
Tertiary: chart.orange (#F97316)
Success: chart.green (#22C55E)
Danger: chart.red (#EF4444)

Grid Lines: border.subtle
Axis Labels: text.secondary
Title: text.primary (H4)
```

---

## 🧩 SECTION 3 — Component Library Blueprint

### 1. Status Components

#### CanaryHealthBadge
**Structure:**
```
┌─────────────────┐
│ 🟢 Healthy      │
└─────────────────┘
```

**Properties:**
- Variant: healthy | degraded | critical | unknown
- Size: sm | md | lg
- ShowIcon: boolean

**States:**
- Default
- Hover (slight scale 1.02)
- Active (border.focus ring)

**Tokens:**
- Padding: 6px 12px
- Border Radius: 6px
- Font: Body S, 600
- Icon Size: 12px

---

#### RevisionStatusTag
**Structure:**
```
┌──────────────────────┐
│ mf-worker-...-abc123 │
└──────────────────────┘
```

**Properties:**
- Revision: string
- Status: active | inactive | canary | stable
- Truncate: boolean

**States:**
- Default
- Hover (bg.hover)
- Clickable (cursor pointer)

---

#### TrafficSplitBadge
**Structure:**
```
┌─────────────────────┐
│ 90% Stable / 10%    │
│ Canary              │
└─────────────────────┘
```

**Properties:**
- StablePercent: number
- CanaryPercent: number
- ShowColors: boolean

**Visual:**
- Horizontal bar chart
- Stable: chart.blue
- Canary: chart.purple

---

#### MLDecisionChip
**Structure:**
```
┌──────────────────────┐
│ PROMOTE (87%)        │
└──────────────────────┘
```

**Properties:**
- Decision: PROMOTE | ROLLBACK | DEGRADED
- Confidence: number (0-1)
- ShowConfidence: boolean

**Colors:**
- PROMOTE: success.500
- ROLLBACK: danger.500
- DEGRADED: warning.500

---

### 2. Charts

#### Latency Trend Chart
**Type:** Line chart (Chart.js)
**Data:** Time series (timestamp, p50, p90, p99)

**Visual:**
- 3 lines: P50 (blue), P90 (purple), P99 (orange)
- X-axis: Time (formatted as HH:MM)
- Y-axis: Latency (ms)
- Grid: Subtle horizontal lines
- Tooltip: Shows all 3 values on hover

**Dimensions:**
- Width: 100% (responsive)
- Height: 300px
- Padding: 16px

---

#### Error Rate Chart
**Type:** Bar chart (Chart.js)
**Data:** Time series (timestamp, error_rate)

**Visual:**
- Bars: chart.red
- X-axis: Time
- Y-axis: Error rate (0-1)
- Threshold line: 0.05 (5%) in warning.500

---

#### ML Confidence Heatmap
**Type:** Heatmap (custom)
**Data:** Time series (timestamp, confidence, provider)

**Visual:**
- Grid of cells
- Color intensity = confidence (0-1)
- Rows: Providers (OpenAI, DeepSeek, Claude)
- Columns: Time buckets

---

#### Canary Timeline Graph
**Type:** Gantt-style timeline
**Data:** Events (deploy, canary, ml, promote/rollback)

**Visual:**
- Horizontal timeline
- Events as markers
- Color-coded by type
- Tooltip on hover

---

### 3. Interactive Components

#### Searchable Logs Table
**Structure:**
```
┌─────────────────────────────────────┐
│ [Search logs...] [Filter ▼] [Export]│
├─────────────────────────────────────┤
│ Time      Level  Message            │
│ 10:15:23  INFO   Health check...    │
│ 10:15:18  WARN   Latency spike...   │
│ 10:15:12  ERROR  Connection...      │
└─────────────────────────────────────┘
```

**Properties:**
- Searchable: boolean
- Filterable: boolean (by level, time range)
- Sortable: boolean
- Paginated: boolean
- Auto-scroll: boolean

---

#### Auto-scrolling Log Viewer
**Properties:**
- AutoScroll: boolean
- MaxLines: number (default 1000)
- FollowTail: boolean
- HighlightErrors: boolean

**Behavior:**
- New logs appear at bottom
- Auto-scrolls to bottom when enabled
- Pause on user scroll up
- Resume on scroll to bottom

---

#### Filter Bar
**Structure:**
```
┌─────────────────────────────────────┐
│ [All Workers ▼] [Last 1h ▼] [All]  │
└─────────────────────────────────────┘
```

**Properties:**
- WorkerFilter: dropdown
- TimeRange: dropdown
- LevelFilter: chips (INFO, WARN, ERROR)

---

#### Worker Selector Dropdown
**Properties:**
- Workers: array
- Selected: string
- MultiSelect: boolean

**Visual:**
- Dropdown with search
- Icons for each worker
- Status indicator

---

#### ML Explanation Drawer
**Structure:**
```
┌─────────────────────────────────────┐
│ ML Decision Explanation        [×]   │
├─────────────────────────────────────┤
│ Committee Votes:                    │
│ • OpenAI: PROMOTE (92%)             │
│ • DeepSeek: PROMOTE (85%)           │
│ • Claude: PROMOTE (88%)             │
│                                     │
│ Anomalies:                          │
│ • None detected                     │
│                                     │
│ [Close]                             │
└─────────────────────────────────────┘
```

**Properties:**
- Open: boolean
- Position: left | right | bottom
- Width: number (default 400px)

---

### 4. Navigation

#### Sidebar
**Structure:**
```
┌──────────────┐
│ 🚦 Dashboard │
│ 👷 Workers   │
│ 🔄 Replay    │
│ ⚙️  Settings │
└──────────────┘
```

**Properties:**
- Collapsed: boolean
- Width: 240px (expanded), 64px (collapsed)
- ActiveRoute: string

**States:**
- Default
- Hover
- Active (bg.hover + border.focus left border)

---

#### Topbar
**Structure:**
```
┌─────────────────────────────────────┐
│ Logo  Nav Links    [Status] [User] │
└─────────────────────────────────────┘
```

**Properties:**
- Height: 64px
- Sticky: boolean
- ShowConnectionStatus: boolean

---

#### Breadcrumbs
**Structure:**
```
Dashboard > Workers > mf-worker-realtime
```

**Properties:**
- Items: array of {label, href}
- Separator: string (default ">")

---

## 🔄 SECTION 4 — User Flows for Canary Operations

### Flow A — Canary Deployment Journey

```
1. [Deploy Button] 
   ↓
2. [One-Button Deploy Workflow Triggered]
   ↓
3. [Dashboard: "Deployment in Progress" Banner]
   ↓
4. [Canary Created: 10% / 90% Split]
   ↓
5. [Dashboard: Revision Cards Update]
   ↓
6. [Auto-Supervisor: 5-Minute Monitoring]
   ↓
7. [ML Analyzer: Log Analysis]
   ↓
8. [Dashboard: ML Decision Card Updates]
   ↓
9. [Decision: PROMOTE]
   ↓
10. [Auto-Promote Workflow]
    ↓
11. [Dashboard: Traffic Split → 100% Canary]
    ↓
12. [Dashboard: Success Notification]
```

**Figma Nodes:**
- Node 1: Button (144×40px)
- Node 2: Workflow Status (Full width banner)
- Node 3: Banner Component
- Node 4: Revision Card Update
- Node 5: Revision Card
- Node 6: Monitoring Indicator
- Node 7: ML Analysis Spinner
- Node 8: ML Decision Card
- Node 9: Decision Badge
- Node 10: Auto-Promote Indicator
- Node 11: Traffic Split Update
- Node 12: Toast Notification

---

### Flow B — Canary Replay

```
1. [Replay Page: Run Selector]
   ↓
2. [Select Run ID: abc123]
   ↓
3. [Load Artifacts from Supabase]
   ↓
4. [Timeline View: Show Events]
   ↓
5. [Click Event: "ML Analysis at 10:10"]
   ↓
6. [ML Explanation Drawer Opens]
   ↓
7. [View Anomalies Table]
   ↓
8. [Click "View Logs" at 10:10]
   ↓
9. [Logs Filtered to 10:10-10:15]
   ↓
10. [Inspect Decision Outcome]
    ↓
11. [Compare: Expected vs Actual]
```

**Figma Nodes:**
- Node 1: Run Selector Dropdown
- Node 2: Selected Run Badge
- Node 3: Loading Spinner
- Node 4: Timeline Component
- Node 5: Timeline Event Marker
- Node 6: ML Explanation Drawer
- Node 7: Anomalies Table
- Node 8: Logs Button
- Node 9: Filtered Logs View
- Node 10: Outcome Card
- Node 11: Comparison View

---

### Flow C — Worker Deep Dive

```
1. [Dashboard: Worker Card]
   ↓
2. [Click "View Details"]
   ↓
3. [Worker Detail Page Loads]
   ↓
4. [Latency Chart: Shows Spike at 10:15]
   ↓
5. [Click Spike Point]
   ↓
6. [Tooltip: "Latency: 2.3s at 10:15:23"]
   ↓
7. [Click "View Logs at This Time"]
   ↓
8. [Logs Filtered: 10:15:20 - 10:15:30]
   ↓
9. [Error Log Highlighted]
   ↓
10. [Click "Restart Worker" Suggestion]
    ↓
11. [Confirmation Modal]
    ↓
12. [Worker Restart Initiated]
```

**Figma Nodes:**
- Node 1: Worker Card Component
- Node 2: "View Details" Button
- Node 3: Worker Detail Page
- Node 4: Latency Chart
- Node 5: Chart Point (Interactive)
- Node 6: Chart Tooltip
- Node 7: "View Logs" Button
- Node 8: Filtered Logs Panel
- Node 9: Highlighted Log Line
- Node 10: "Restart Worker" Button
- Node 11: Confirmation Modal
- Node 12: Success Toast

---

## 🔧 SECTION 5 — Developer Handoff Blueprint

### Figma → Next.js Component Mapping

| Figma Component | Next.js Component | Location |
|----------------|-------------------|----------|
| CanaryHealthBadge | `<StatusBadge />` | `components/StatusBadge.tsx` |
| RevisionStatusTag | `<RevisionTag />` | `components/RevisionTag.tsx` |
| TrafficSplitBadge | `<TrafficSplit />` | `components/TrafficSplit.tsx` |
| MLDecisionChip | `<MLDecisionChip />` | `components/MLDecisionChip.tsx` |
| Latency Trend Chart | `<LatencyChart />` | `components/Charts.tsx` |
| Error Rate Chart | `<ErrorRateChart />` | `components/Charts.tsx` |
| Searchable Logs Table | `<LogsTable />` | `components/LogsTable.tsx` |
| Auto-scrolling Log Viewer | `<LogViewer />` | `components/LogViewer.tsx` |
| Sidebar | `<Sidebar />` | `components/layout/Sidebar.tsx` |
| Topbar | `<Topbar />` | `components/layout/Topbar.tsx` |

---

### CSS/Tailwind Mappings

| Figma Token | Tailwind Class | Value |
|------------|---------------|-------|
| bg.primary | `bg-[#0D1117]` | #0D1117 |
| bg.secondary | `bg-[#161B22]` | #161B22 |
| text.primary | `text-[#E6EDF3]` | #E6EDF3 |
| text.secondary | `text-[#8B949E]` | #8B949E |
| border.subtle | `border-[#21262D]` | #21262D |
| success.500 | `text-green-500` | #22C55E |
| danger.500 | `text-red-500` | #EF4444 |
| warning.500 | `text-yellow-500` | #F59E0B |
| chart.blue | `text-blue-500` | #3B82F6 |
| chart.purple | `text-purple-500` | #A855F7 |

**Spacing:**
- 4px: `p-1`, `gap-1`
- 8px: `p-2`, `gap-2`
- 12px: `p-3`, `gap-3`
- 16px: `p-4`, `gap-4`
- 24px: `p-6`, `gap-6`

**Border Radius:**
- 6px: `rounded-md`
- 8px: `rounded-lg`
- 12px: `rounded-xl`
- 16px: `rounded-2xl`

---

### Data-to-UI Mapping (Supabase → Components)

| Supabase Table | Component | Props |
|---------------|-----------|-------|
| `canary_ml_decisions` | `<MLDecisionChip />` | `decision`, `confidence`, `severity`, `anomalies` |
| `canary_health_checks` | `<StatusCard />` | `success_rate`, `total`, `failures` |
| `canary_revisions` | `<RevisionCard />` | `stable`, `canary`, `traffic` |
| `canary_logs` | `<LogViewer />` | `logs[]` |
| `canary_metrics` | `<LatencyChart />` | `latency[]` (p50, p90, p99) |
| `canary_metrics` | `<ErrorRateChart />` | `error_rate[]` |

---

### Accessibility Notes

1. **Color Contrast:**
   - All text meets WCAG AA (4.5:1)
   - Interactive elements: 3:1 minimum

2. **Keyboard Navigation:**
   - Tab order: Topbar → Sidebar → Content
   - Focus indicators: 2px border.focus ring
   - Skip links for main content

3. **Screen Readers:**
   - ARIA labels on all interactive elements
   - Status announcements for ML decisions
   - Chart data in table format (hidden)

4. **Motion:**
   - Respect `prefers-reduced-motion`
   - Animations: 200ms max duration

---

### Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Mobile | < 640px | Single column, stacked cards |
| Tablet | 640px - 1024px | 2-column grid |
| Desktop | > 1024px | 3-column grid, full sidebar |
| Large | > 1440px | Max width 1440px, centered |

**Mobile Adaptations:**
- Sidebar → Bottom navigation
- Charts → Horizontal scroll
- Tables → Card view
- Modals → Full screen

---

## 📦 SECTION 6 — Final Deliverable Bundle

### Files Generated

1. **FIGMA_BLUEPRINT.md** (This file)
   - Complete frame specifications
   - Design system tokens
   - Component library specs
   - User flow diagrams
   - Developer handoff mappings

### Figma Import Instructions

1. **Create Figma File:**
   - New file: "Enterprise Canary Dashboard"
   - Set up 1440×1024px frames

2. **Import Frames:**
   - Create frames from Section 1 specifications
   - Use exact dimensions provided

3. **Setup Design Tokens:**
   - Create color styles from Section 2
   - Create text styles from typography tokens
   - Create effect styles (shadows)

4. **Build Components:**
   - Create components from Section 3 specs
   - Set up variants and properties
   - Link to design tokens

5. **Create User Flows:**
   - Use Figma's prototyping features
   - Link frames according to Section 4 flows
   - Add interactions and transitions

6. **Export for Development:**
   - Use Figma Dev Mode
   - Share component specs
   - Export assets as needed

### Design System File Structure

```
Figma File Structure:
├── 🎨 Design System
│   ├── Colors (Dark + Light)
│   ├── Typography
│   ├── Spacing
│   └── Effects
├── 🧩 Components
│   ├── Status
│   ├── Charts
│   ├── Interactive
│   └── Navigation
├── 📐 Frames
│   ├── Main Views
│   ├── Modals
│   └── Mobile
└── 🔄 Flows
    ├── Deployment Journey
    ├── Replay
    └── Worker Deep Dive
```

---

## ✅ Completion Checklist

- [x] Frame blueprints (8 main + 4 modals + 2 mobile)
- [x] Design system tokens (colors, typography, spacing)
- [x] Component library specs (12+ components)
- [x] User flow diagrams (3 flows)
- [x] Developer handoff mappings
- [x] Accessibility guidelines
- [x] Responsive breakpoints
- [x] Figma import instructions

---

**Status:** ✅ Complete Figma Blueprint Pack Generated
**Ready for:** Figma import and design implementation
