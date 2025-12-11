# Figma Frame Specifications — Enterprise Canary Dashboard

## 📐 Complete Frame Blueprint for Figma Import

This document provides exact specifications for creating all frames in Figma based on Section 1 of FIGMA_BLUEPRINT.md.

---

## 🖼️ Main Frames (1440×1024px)

### Frame 1: Canary Dashboard — Home

**Frame Properties:**
- **Name:** `01_Dashboard_Home`
- **Size:** 1440×1024px
- **Layout Grid:** 12 columns, 24px gutters, 8px baseline
- **Padding:** 24px outer, 16px inner
- **Background:** `bg.primary` (#0D1117)

**Layer Structure:**
```
01_Dashboard_Home (1440×1024)
├── Topbar (1440×64)
│   ├── Logo (120×32) [x: 24, y: 16]
│   ├── NavLinks (600×32) [x: 160, y: 16]
│   │   ├── Dashboard (80×32)
│   │   ├── Workers (80×32)
│   │   ├── Replay (80×32)
│   │   └── Settings (80×32)
│   ├── ConnectionStatus (120×32) [x: 1200, y: 16]
│   └── UserMenu (120×32) [x: 1320, y: 16]
│
├── MainContent (1392×920) [x: 24, y: 88]
│   ├── StatusCardsRow (1392×200) [x: 0, y: 0]
│   │   ├── RevisionCard (400×200) [x: 0, y: 0]
│   │   │   ├── Title (400×24) "Current Revisions"
│   │   │   ├── StableRevision (400×40) "mf-worker-realtime-xyz789"
│   │   │   ├── CanaryRevision (400×40) "mf-worker-realtime-abc123"
│   │   │   └── TrafficSplit (400×80) "90% Stable / 10% Canary"
│   │   │
│   │   ├── MLDecisionCard (400×200) [x: 424, y: 0]
│   │   │   ├── Title (400×24) "ML Decision"
│   │   │   ├── DecisionBadge (400×48) "PROMOTE (87%)"
│   │   │   ├── ConfidenceBar (400×32) "Confidence: 87%"
│   │   │   └── SeverityBadge (400×32) "Severity: OK"
│   │   │
│   │   └── HealthMetricsCard (400×200) [x: 848, y: 0]
│   │       ├── Title (400×24) "Health Metrics"
│   │       ├── SuccessRate (400×40) "99.2%"
│   │       ├── TotalChecks (400×40) "1,234 checks"
│   │       └── Failures (400×40) "12 failures"
│   │
│   ├── ChartsSection (1392×400) [x: 0, y: 224]
│   │   ├── LatencyChart (680×400) [x: 0, y: 0]
│   │   │   ├── Title (680×32) "Latency Trend (P50/P90/P99)"
│   │   │   └── ChartArea (680×368) [Chart.js line chart]
│   │   │
│   │   ├── ErrorRateChart (680×400) [x: 712, y: 0]
│   │   │   ├── Title (680×32) "Error Rate"
│   │   │   └── ChartArea (680×368) [Chart.js bar chart]
│   │   │
│   │   └── MLConfidenceTrend (1392×200) [x: 0, y: 424]
│   │       ├── Title (1392×32) "ML Confidence Trend"
│   │       └── ChartArea (1392×168) [Heatmap]
│   │
│   └── LiveLogsStream (1392×320) [x: 0, y: 624]
│       ├── LogControls (1392×48)
│       │   ├── FilterButton (80×32) "Filter"
│       │   ├── SearchInput (300×32) "Search logs..."
│       │   ├── AutoScrollToggle (120×32) "Auto-scroll ✓"
│       │   ├── ExportButton (80×32) "Export"
│       │   └── ClearButton (80×32) "Clear"
│       │
│       └── LogStream (1392×272)
│           ├── LogLine1 (1392×20) "[10:15:23] [INFO] Health check passed"
│           ├── LogLine2 (1392×20) "[10:15:18] [INFO] Processing request"
│           ├── LogLine3 (1392×20) "[10:15:12] [WARN] Latency spike detected"
│           └── ... (scrollable, max 1000 lines)
```

**Exact Measurements:**
- Topbar: 64px height, full width
- Status Cards: 400px width each, 200px height, 24px gap
- Charts: 680px width each, 400px height, 24px gap
- Logs: Full width, 320px height
- All padding: 24px outer, 16px inner

---

### Frame 2: Worker Detail View

**Frame Properties:**
- **Name:** `02_Worker_Detail`
- **Size:** 1440×1024px
- **Layout Grid:** 12 columns
- **Background:** `bg.primary` (#0D1117)

**Layer Structure:**
```
02_Worker_Detail (1440×1024)
├── Topbar (1440×64) [Same as Frame 1]
│
├── Breadcrumbs (1392×32) [x: 24, y: 88]
│   └── BreadcrumbText "Dashboard > Workers > mf-worker-realtime"
│
├── WorkerInfoPanel (400×400) [x: 24, y: 136]
│   ├── WorkerName (400×32) "mf-worker-realtime"
│   ├── RevisionTag (400×40) "mf-worker-realtime-abc123"
│   ├── StatusBadge (400×32) "🟢 Healthy"
│   ├── TrafficPercent (400×32) "10% Canary"
│   ├── Uptime (400×32) "Uptime: 99.2%"
│   └── LastRestart (400×32) "Last restart: 2h ago"
│
├── PerformanceMetricsPanel (968×400) [x: 448, y: 136]
│   ├── Title (968×32) "Performance Metrics"
│   ├── LatencyMetrics (968×120)
│   │   ├── P50 (320×40) "P50: 120ms"
│   │   ├── P90 (320×40) "P90: 250ms"
│   │   └── P99 (320×40) "P99: 500ms"
│   ├── ErrorRate (968×40) "Error Rate: 0.5%"
│   ├── RequestVolume (968×40) "Requests: 1,234/min"
│   └── RestartCount (968×40) "Restarts: 2"
│
├── TimelineView (1392×200) [x: 24, y: 560]
│   ├── Title (1392×32) "Revision History"
│   └── Timeline (1392×168)
│       └── TimelineBar (horizontal, with markers)
│
└── RecentLogs (1392×200) [x: 24, y: 784]
    ├── Title (1392×32) "Recent Logs"
    ├── FilterBar (1392×32)
    └── LogTable (1392×136)
        └── LogRows (scrollable)
```

---

### Frame 3: ML Committee Decision Pane

**Frame Properties:**
- **Name:** `03_ML_Decision_Pane`
- **Size:** 1440×1024px
- **Layout:** Split view (60/40)

**Layer Structure:**
```
03_ML_Decision_Pane (1440×1024)
├── Topbar (1440×64) [Same as Frame 1]
│
├── MLDecisionSummary (832×600) [x: 24, y: 88]
│   ├── Title (832×32) "ML Decision Summary"
│   ├── DecisionBadge (832×64) "PROMOTE" (large, centered)
│   ├── ConfidenceDisplay (832×48) "Confidence: 87%"
│   ├── SeverityBadge (832×32) "Severity: OK"
│   ├── SummaryText (832×120)
│   │   └── "No anomalies detected. All health checks passed."
│   ├── AnomaliesList (832×200)
│   │   └── "Anomalies: None"
│   └── ActionButtons (832×64)
│       ├── PromoteButton (200×48) "Promote"
│       └── RollbackButton (200×48) "Rollback"
│
├── CommitteeVotes (560×600) [x: 880, y: 88]
│   ├── Title (560×32) "Committee Votes"
│   ├── VoteCard1 (560×120)
│   │   ├── ProviderName "OpenAI"
│   │   ├── Decision "PROMOTE"
│   │   └── Confidence "Confidence: 0.92"
│   ├── VoteCard2 (560×120)
│   │   ├── ProviderName "DeepSeek"
│   │   ├── Decision "PROMOTE"
│   │   └── Confidence "Confidence: 0.85"
│   ├── VoteCard3 (560×120)
│   │   ├── ProviderName "Claude"
│   │   ├── Decision "PROMOTE"
│   │   └── Confidence "Confidence: 0.88"
│   └── MajorityBadge (560×48) "Majority: PROMOTE (3/3)"
│
└── AnomalyDetailsTable (1392×280) [x: 24, y: 712]
    ├── Title (1392×32) "Anomaly Details"
    └── Table (1392×248)
        ├── HeaderRow (1392×40)
        │   ├── Time (200×40) "Time"
        │   ├── Type (200×40) "Type"
        │   ├── Severity (200×40) "Severity"
        │   └── Description (792×40) "Description"
        └── DataRows (scrollable, empty state shown)
```

---

### Frame 4: Canary Replay Timeline

**Frame Properties:**
- **Name:** `04_Canary_Replay`
- **Size:** 1440×1024px
- **Layout:** Timeline-centered

**Layer Structure:**
```
04_Canary_Replay (1440×1024)
├── Topbar (1440×64) [Same as Frame 1]
│
├── ReplayControls (1392×64) [x: 24, y: 88]
│   ├── PreviousButton (120×40) "← Previous"
│   ├── RunIdDisplay (300×40) "Run ID: abc123"
│   ├── NextButton (120×40) "Next →"
│   ├── PlayButton (80×40) "Play"
│   └── PauseButton (80×40) "Pause"
│
├── Timeline (1392×120) [x: 24, y: 176]
│   ├── TimelineBar (1392×4) [horizontal line]
│   ├── Marker1 (24×24) [x: 0, y: -10] "Deploy 10:00"
│   ├── Marker2 (24×24) [x: 300, y: -10] "Canary 10:05"
│   ├── Marker3 (24×24) [x: 600, y: -10] "ML 10:10"
│   └── Marker4 (24×24) [x: 900, y: -10] "Promote 10:15"
│
└── StateSnapshots (1392×680) [x: 24, y: 320]
    ├── StateAt1000 (440×680) [x: 0, y: 0]
    │   ├── Title "State at 10:00"
    │   ├── RevisionsCard (440×200)
    │   ├── TrafficCard (440×200)
    │   └── MetricsCard (440×200)
    │
    ├── StateAt1010 (440×680) [x: 464, y: 0]
    │   ├── Title "State at 10:10"
    │   ├── MLDecisionCard (440×200)
    │   ├── AnomaliesCard (440×200)
    │   └── MetricsCard (440×200)
    │
    └── StateAt1015 (440×680) [x: 928, y: 0]
        ├── Title "State at 10:15"
        ├── FinalOutcomeCard (440×200)
        ├── MetricsCard (440×200)
        └── TrafficCard (440×200)
```

---

### Frame 5: Live Logs Stream

**Frame Properties:**
- **Name:** `05_Live_Logs_Stream`
- **Size:** 1440×1024px
- **Layout:** Full-width log viewer

**Layer Structure:**
```
05_Live_Logs_Stream (1440×1024)
├── Topbar (1440×64) [Same as Frame 1]
│
├── LogControls (1392×64) [x: 24, y: 88]
│   ├── FilterDropdown (120×40) "Filter ▼"
│   ├── SearchInput (400×40) "Search logs..."
│   ├── AutoScrollToggle (140×40) "Auto-scroll ✓"
│   ├── ExportButton (100×40) "Export"
│   └── ClearButton (100×40) "Clear"
│
├── LogStream (1392×800) [x: 24, y: 176]
│   ├── LogLine1 (1392×20) "[10:15:23] [INFO] Health check passed"
│   ├── LogLine2 (1392×20) "[10:15:18] [INFO] Processing request"
│   ├── LogLine3 (1392×20) "[10:15:12] [WARN] Latency spike detected"
│   ├── LogLine4 (1392×20) "[10:15:08] [ERROR] Connection timeout"
│   ├── LogLine5 (1392×20) "[10:15:05] [INFO] Worker started"
│   └── ... (scrollable, max 1000 lines, auto-scrolling)
│
└── LogStatistics (1392×64) [x: 24, y: 1000]
    ├── TotalLogs "Total: 1,234"
    ├── Errors "Errors: 12"
    ├── Warnings "Warnings: 45"
    └── Info "Info: 1,177"
```

**Log Line Format:**
- Font: `Mono M` (JetBrains Mono, 12px)
- Line Height: 20px
- Padding: 4px 0px
- Colors:
  - INFO: `text.secondary` (#8B949E)
  - WARN: `text.warning.500` (#F59E0B)
  - ERROR: `text.danger.500` (#EF4444)
  - DEBUG: `text.muted` (#6E7681)

---

### Frame 6: Revision Comparison View

**Frame Properties:**
- **Name:** `06_Revision_Comparison`
- **Size:** 1440×1024px
- **Layout:** Side-by-side comparison

**Layer Structure:**
```
06_Revision_Comparison (1440×1024)
├── Topbar (1440×64) [Same as Frame 1]
│
├── ComparisonHeader (1392×48) [x: 24, y: 88]
│   └── Title "Comparison: Stable vs Canary"
│
├── StableRevision (680×800) [x: 24, y: 160]
│   ├── RevisionTag (680×40) "mf-worker-realtime-xyz789"
│   ├── MetricsCard (680×200)
│   │   ├── Latency "P50: 120ms"
│   │   ├── Errors "Error Rate: 0.3%"
│   │   └── Requests "Requests: 1,200/min"
│   ├── HealthCard (680×200)
│   │   ├── Status "Status: ✅ Healthy"
│   │   └── Uptime "Uptime: 99%"
│   └── ViewDetailsButton (200×48) "View Details"
│
└── CanaryRevision (680×800) [x: 736, y: 160]
    ├── RevisionTag (680×40) "mf-worker-realtime-abc123"
    ├── MetricsCard (680×200)
    │   ├── Latency "P50: 115ms"
    │   ├── Errors "Error Rate: 0.5%"
    │   └── Requests "Requests: 1,234/min"
    ├── HealthCard (680×200)
    │   ├── Status "Status: ✅ Healthy"
    │   └── Uptime "Uptime: 98%"
    └── ViewDetailsButton (200×48) "View Details"
```

---

### Frame 7: Auth Login Page

**Frame Properties:**
- **Name:** `07_Auth_Login`
- **Size:** 1440×1024px
- **Layout:** Centered card

**Layer Structure:**
```
07_Auth_Login (1440×1024)
├── Background (1440×1024) [bg.primary]
│
└── LoginCard (400×400) [x: 520, y: 312, centered]
    ├── Icon (80×80) [x: 160, y: 0] 🔐
    ├── Title (400×32) [x: 0, y: 100] "Dashboard Login"
    ├── TokenInput (400×48) [x: 0, y: 160]
    │   └── Placeholder "Admin Token"
    ├── LoginButton (400×48) [x: 0, y: 232] "Login"
    └── ForgotLink (400×24) [x: 0, y: 304] "Forgot token?"
```

**Card Styling:**
- Background: `bg.secondary` (#161B22)
- Border: 1px solid `border.subtle` (#21262D)
- Border Radius: 8px
- Padding: 24px
- Shadow: None (flat design)

---

### Frame 8: Settings & Feature Flags

**Frame Properties:**
- **Name:** `08_Settings`
- **Size:** 1440×1024px
- **Layout:** Settings sidebar + content

**Layer Structure:**
```
08_Settings (1440×1024)
├── Topbar (1440×64) [Same as Frame 1]
│
├── SettingsSidebar (240×920) [x: 24, y: 88]
│   ├── GeneralItem (240×48) "General" [active]
│   ├── WorkersItem (240×48) "Workers"
│   ├── MLItem (240×48) "ML"
│   ├── AlertsItem (240×48) "Alerts"
│   └── APIItem (240×48) "API"
│
└── SettingsContent (1128×920) [x: 288, y: 88]
    ├── SectionTitle (1128×32) "General"
    ├── RefreshRateSection (1128×120)
    │   ├── Label "Dashboard Refresh Rate"
    │   └── RadioButtons
    │       ├── "5s" [selected]
    │       ├── "10s"
    │       ├── "30s"
    │       └── "Manual"
    │
    ├── AutoRefreshSection (1128×80)
    │   ├── Label "Auto-refresh Logs"
    │   └── Toggle [✓] Enabled
    │
    └── FeatureFlagsSection (1128×400)
        ├── Title "Feature Flags"
        ├── Flag1 "ML Committee Voting" [✓]
        ├── Flag2 "WebSocket Streaming" [✓]
        └── Flag3 "Experimental Charts" [ ]
```

---

## 🪟 Modal Frames

### Modal 1: Promote Canary Modal

**Frame Properties:**
- **Name:** `Modal_01_Promote_Canary`
- **Size:** 600×400px
- **Position:** Centered overlay (420×312 from top-left)

**Layer Structure:**
```
Modal_01_Promote_Canary (600×400)
├── Overlay (1440×1024) [rgba(0,0,0,0.5), behind modal]
│
└── ModalCard (600×400) [x: 420, y: 312]
    ├── Title (600×48) "Promote Canary to 100%?"
    ├── CurrentState (600×80)
    │   └── "Current: 10% canary / 90% stable"
    ├── TargetState (600×80)
    │   └── "Target: 100% canary"
    ├── MLDecision (600×80)
    │   ├── "ML Decision: PROMOTE"
    │   └── "Confidence: 87%"
    └── ActionButtons (600×64)
        ├── CancelButton (140×48) "Cancel"
        └── ConfirmButton (200×48) "Confirm Promote"
```

---

### Modal 2: Rollback Revision Modal

**Frame Properties:**
- **Name:** `Modal_02_Rollback_Revision`
- **Size:** 600×400px
- **Position:** Centered overlay

**Layer Structure:**
```
Modal_02_Rollback_Revision (600×400)
├── Overlay (1440×1024) [rgba(0,0,0,0.5)]
│
└── ModalCard (600×400)
    ├── Title (600×48) "Rollback to Stable Revision?"
    ├── CurrentRevision (600×80) "Current: mf-worker-...-abc123"
    ├── TargetRevision (600×80) "Target: mf-worker-...-xyz789"
    ├── WarningText (600×120)
    │   └── "This will route 100% traffic to the previous stable revision."
    └── ActionButtons (600×64)
        ├── CancelButton (140×48) "Cancel"
        └── ConfirmButton (200×48) "Confirm Rollback"
```

---

### Modal 3: Worker Health Diagnostics Modal

**Frame Properties:**
- **Name:** `Modal_03_Worker_Health`
- **Size:** 800×600px
- **Position:** Centered overlay

**Layer Structure:**
```
Modal_03_Worker_Health (800×600)
├── Overlay (1440×1024) [rgba(0,0,0,0.5)]
│
└── ModalCard (800×600)
    ├── Title (800×48) "Worker Health Diagnostics"
    ├── WorkerInfo (800×80)
    │   ├── "Worker: mf-worker-realtime"
    │   └── "Status: ⚠️ Degraded"
    ├── IssuesList (800×200)
    │   ├── "Issues Detected:"
    │   ├── "• Latency spike at 10:15"
    │   ├── "• 3 failed health checks"
    │   └── "• Memory usage: 85%"
    ├── RecommendedActions (800×120)
    │   └── "Recommended Actions:"
    └── ActionButtons (800×64)
        ├── RestartButton (160×48) "Restart Worker"
        ├── ViewLogsButton (160×48) "View Logs"
        └── IgnoreButton (120×48) "Ignore"
```

---

### Modal 4: ML Explanation Modal

**Frame Properties:**
- **Name:** `Modal_04_ML_Explanation`
- **Size:** 700×500px
- **Position:** Centered overlay

**Layer Structure:**
```
Modal_04_ML_Explanation (700×500)
├── Overlay (1440×1024) [rgba(0,0,0,0.5)]
│
└── ModalCard (700×500)
    ├── Title (700×48) "ML Decision Explanation"
    ├── DecisionBadge (700×64) "Decision: PROMOTE"
    ├── CommitteeVotes (700×200)
    │   ├── "Committee Votes:"
    │   ├── "• OpenAI: PROMOTE (92% confidence)"
    │   ├── "• DeepSeek: PROMOTE (85% confidence)"
    │   └── "• Claude: PROMOTE (88% confidence)"
    ├── Analysis (700×120)
    │   └── "All three ML providers agree that the canary is healthy and ready for full promotion. No anomalies detected."
    └── CloseButton (120×48) "Close"
```

---

## 📱 Mobile Frames (375×812px)

### Mobile Frame 1: Dashboard Mobile

**Frame Properties:**
- **Name:** `Mobile_01_Dashboard`
- **Size:** 375×812px
- **Layout:** Single column, stacked

**Layer Structure:**
```
Mobile_01_Dashboard (375×812)
├── MobileTopbar (375×56)
│   ├── HamburgerMenu (40×40) [☰]
│   └── Title "Dashboard"
│
├── RevisionCard (343×200) [x: 16, y: 72]
│   └── [Same content as desktop, full width]
│
├── MLDecisionCard (343×200) [x: 16, y: 288]
│   └── [Same content as desktop, full width]
│
├── HealthMetricsCard (343×200) [x: 16, y: 504]
│   └── [Same content as desktop, full width]
│
├── LatencyChart (343×300) [x: 16, y: 720]
│   └── [Horizontal scroll enabled]
│
└── ViewLogsButton (343×48) [x: 16, y: 1036] "View Logs →"
```

**Mobile Adaptations:**
- Sidebar → Bottom navigation (not shown in this frame)
- Charts → Horizontal scroll
- Cards → Full width, stacked vertically
- Padding: 16px outer (reduced from 24px)

---

## 📋 Frame Import Checklist

### Step 1: Create Frames
- [ ] Create 8 main frames (1440×1024px)
- [ ] Create 4 modal frames (various sizes)
- [ ] Create 2 mobile frames (375×812px)

### Step 2: Apply Layout Grids
- [ ] Apply 12-column grid to all desktop frames
- [ ] Apply 8px baseline grid
- [ ] Set 24px outer padding

### Step 3: Build Layer Structure
- [ ] Create Topbar component (reusable)
- [ ] Create Status Cards
- [ ] Create Chart placeholders
- [ ] Create Log Stream components

### Step 4: Apply Design Tokens
- [ ] Link colors to design tokens
- [ ] Link typography to text styles
- [ ] Apply spacing tokens
- [ ] Apply border radius tokens

### Step 5: Create Components
- [ ] Convert reusable elements to components
- [ ] Set up component variants
- [ ] Link components to design tokens

---

**Status:** ✅ Complete Frame Specifications Generated
**Ready for:** Figma frame creation and component assembly
