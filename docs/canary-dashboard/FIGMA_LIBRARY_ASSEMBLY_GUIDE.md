# Figma Library Assembly Guide — Enterprise Canary Dashboard

## 🎯 Complete Step-by-Step Implementation Guide

This guide provides exact instructions for assembling the Enterprise Canary Dashboard design system in Figma, converting all blueprints into a production-ready Figma library.

---

## 📋 Pre-Assembly Checklist

### Prerequisites
- [ ] Figma Desktop App or Figma Web (latest version)
- [ ] Access to create new files
- [ ] Design tokens JSON file (`FIGMA_DESIGN_TOKENS.json`)
- [ ] Frame specifications (`FIGMA_FRAME_SPECIFICATIONS.md`)
- [ ] Component blueprints (`FIGMA_COMPONENT_BLUEPRINTS.md`)

### File Setup
- [ ] Create new Figma file: **"Enterprise Canary Dashboard"**
- [ ] Set up file structure (see Section 1)
- [ ] Enable Dev Mode (for handoff)

---

## 🗂️ SECTION 1 — File Structure Setup

### Create Top-Level Pages

1. **Create Pages:**
   ```
   📁 Enterprise Canary Dashboard
   ├── 🎨 Design System
   ├── 🧩 Components
   ├── 📐 Frames
   │   ├── Main Views
   │   ├── Modals
   │   └── Mobile
   └── 🔄 Flows
   ```

2. **Rename Default Page:**
   - Right-click "Page 1" → Rename to "🎨 Design System"

3. **Create Additional Pages:**
   - Click "+" → Name: "🧩 Components"
   - Click "+" → Name: "📐 Frames"
   - Click "+" → Name: "🔄 Flows"

4. **Create Sub-Pages:**
   - In "📐 Frames" page:
     - Create frame group: "Main Views"
     - Create frame group: "Modals"
     - Create frame group: "Mobile"

---

## 🎨 SECTION 2 — Design Tokens Implementation

### Step 1: Color Styles (Dark Theme)

1. **Navigate to:** `🎨 Design System` page

2. **Create Color Styles:**
   - Go to: **Design** → **Color Styles** (or press `Cmd/Ctrl + /`)

3. **Semantic Colors:**
   ```
   Create Color Style:
   - Name: "Semantic/Success/50"
   - Value: #F0FDF4
   - Type: Solid
   
   Repeat for:
   - Semantic/Success/100 → #DCFCE7
   - Semantic/Success/500 → #22C55E
   - Semantic/Success/600 → #16A34A
   - Semantic/Success/700 → #15803D
   
   (Repeat for Warning and Danger with same structure)
   ```

4. **Chart Colors:**
   ```
   Create Color Style:
   - Name: "Chart/Blue"
   - Value: #3B82F6
   
   Repeat for:
   - Chart/Purple → #A855F7
   - Chart/Orange → #F97316
   - Chart/Green → #22C55E
   - Chart/Red → #EF4444
   - Chart/Yellow → #EAB308
   ```

5. **Traffic Colors:**
   ```
   - Traffic/Stable → #3B82F6
   - Traffic/Canary → #A855F7
   - Traffic/Split → #6B7280
   ```

6. **Background Colors:**
   ```
   - Background/Primary → #0D1117
   - Background/Secondary → #161B22
   - Background/Tertiary → #1F2937
   - Background/Subtle → #0F1419
   - Background/Hover → #1C2128
   ```

7. **Border Colors:**
   ```
   - Border/Subtle → #21262D
   - Border/Strong → #30363D
   - Border/Focus → #58A6FF
   ```

8. **Text Colors:**
   ```
   - Text/Primary → #E6EDF3
   - Text/Secondary → #8B949E
   - Text/Muted → #6E7681
   - Text/Inverse → #0D1117
   ```

9. **Light Theme Colors:**
   ```
   (Repeat above structure with Light theme values)
   - Light/Background/Primary → #FFFFFF
   - Light/Background/Secondary → #F6F8FA
   - etc.
   ```

### Step 2: Text Styles

1. **Navigate to:** `🎨 Design System` page

2. **Create Text Styles:**
   - Go to: **Design** → **Text Styles**

3. **Headings:**
   ```
   Create Text Style:
   - Name: "Heading/H1"
   - Font: Inter
   - Size: 32px
   - Weight: 700 (Bold)
   - Letter Spacing: -0.5px
   - Line Height: 40px
   
   Repeat for:
   - Heading/H2 → 24px, 600, -0.25px, 32px
   - Heading/H3 → 20px, 600, 0px, 28px
   - Heading/H4 → 18px, 600, 0px, 24px
   - Heading/H5 → 16px, 600, 0px, 22px
   - Heading/H6 → 14px, 600, 0px, 20px
   ```

4. **Body Text:**
   ```
   - Body/Large → Inter, 16px, 400, 0px, 24px
   - Body/Medium → Inter, 14px, 400, 0px, 20px
   - Body/Small → Inter, 12px, 400, 0px, 16px
   ```

5. **Mono Text:**
   ```
   - Mono/Large → JetBrains Mono, 14px, 400, 0px, 20px
   - Mono/Medium → JetBrains Mono, 12px, 400, 0px, 20px
   - Mono/Small → JetBrains Mono, 11px, 400, 0px, 16px
   ```

### Step 3: Effect Styles (Shadows)

1. **Create Effect Styles:**
   - Go to: **Design** → **Effect Styles**

2. **Create Shadows:**
   ```
   Create Effect Style:
   - Name: "Shadow/Card Hover"
   - Type: Drop Shadow
   - X: 0, Y: 4, Blur: 12, Spread: 0
   - Color: rgba(0, 0, 0, 0.15)
   
   Repeat for:
   - Shadow/Modal → 0, 8, 24, 0, rgba(0, 0, 0, 0.25)
   - Shadow/Focus → 0, 0, 0, 2, rgba(88, 166, 255, 0.3)
   ```

### Step 4: Spacing Tokens (Documentation)

1. **Create Spacing Reference Frame:**
   - Frame: 400×600px
   - Title: "Spacing Scale"
   - Show visual examples:
     - 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

2. **Create Radius Reference:**
   - Frame: 400×400px
   - Title: "Border Radius"
   - Show examples:
     - 6px (sm)
     - 8px (md)
     - 12px (lg)
     - 16px (xl)

---

## 🧩 SECTION 3 — Component Creation

### Step 1: Create Base Components

1. **Navigate to:** `🧩 Components` page

2. **Create Component Structure:**
   ```
   📁 Components
   ├── Status
   ├── Charts
   ├── Interactive
   └── Navigation
   ```

### Step 2: CanaryStatusBadge Component

1. **Create Base:**
   - Rectangle: 80×24px
   - Background: Use "Semantic/Success/500"
   - Border Radius: 12px
   - Padding: 4px 12px (Auto Layout)

2. **Add Text:**
   - Text: "Healthy"
   - Style: "Body/Small", Weight: 600
   - Color: "Text/Inverse"

3. **Add Icon (Optional):**
   - Emoji or Icon: 🟢
   - Size: 12×12px
   - Gap: 8px from text

4. **Create Variants:**
   - Select component → Right-click → "Add Variant"
   - Create variants:
     - `Variant=healthy,degraded,critical,unknown`
     - `Size=sm,md,lg`
     - `ShowIcon=true,false`

5. **Set Variant Properties:**
   - For each variant, update:
     - Background color
     - Text content
     - Icon visibility

6. **Convert to Component:**
   - Select all → Right-click → "Create Component"
   - Name: "CanaryStatusBadge"

### Step 3: MLDecisionChip Component

1. **Create Base:**
   - Rectangle: Auto-width × 32px
   - Background: Use "Semantic/Success/500"
   - Border Radius: 16px
   - Padding: 6px 16px (Auto Layout)

2. **Add Text:**
   - Text: "PROMOTE"
   - Style: "Body/Medium", Weight: 600
   - Color: "Text/Inverse"

3. **Add Confidence (Optional):**
   - Text: "(87%)"
   - Style: "Body/Small", Weight: 500
   - Opacity: 0.9
   - Gap: 8px

4. **Create Variants:**
   - `Decision=PROMOTE,ROLLBACK,DEGRADED`
   - `ShowConfidence=true,false`

5. **Convert to Component:**
   - Name: "MLDecisionChip"

### Step 4: TrafficSplitBar Component

1. **Create Container:**
   - Rectangle: 400×48px
   - Background: "Background/Subtle"
   - Border Radius: 6px
   - Auto Layout: Horizontal, 0px gap

2. **Create Stable Bar:**
   - Rectangle: 360×48px (90% width)
   - Background: "Traffic/Stable"
   - Auto Layout: Center, 8px gap

3. **Add Stable Label:**
   - Text: "90% Stable"
   - Style: "Body/Small", Weight: 600
   - Color: "Text/Inverse"

4. **Create Canary Bar:**
   - Rectangle: 40×48px (10% width)
   - Background: "Traffic/Canary"
   - Same label structure

5. **Create Variants:**
   - `ShowColors=true,false`
   - `ShowLabels=true,false`

6. **Convert to Component:**
   - Name: "TrafficSplitBar"

### Step 5: MetricCard Component

1. **Create Card Base:**
   - Rectangle: 400×200px
   - Background: "Background/Secondary"
   - Border: 1px solid "Border/Subtle"
   - Border Radius: 8px
   - Padding: 24px (Auto Layout: Vertical, 16px gap)

2. **Add Header:**
   - Text: "Health Metrics"
   - Style: "Heading/H6"
   - Color: "Text/Secondary"

3. **Add Value:**
   - Text: "99.2%"
   - Style: "Heading/H2"
   - Color: "Text/Primary"

4. **Add Change Indicator (Optional):**
   - Text: "+5.2%"
   - Style: "Body/Small"
   - Color: "Semantic/Success/500"

5. **Add Chart Placeholder (Optional):**
   - Rectangle: 400×72px
   - Background: "Background/Tertiary"
   - Border Radius: 6px

6. **Create Variants:**
   - `ShowChart=true,false`
   - `ChartType=line,bar,none`

7. **Convert to Component:**
   - Name: "MetricCard"

### Step 6: Chart Components (Placeholders)

1. **ErrorRateChart:**
   - Frame: 680×400px
   - Background: "Background/Secondary"
   - Border: 1px solid "Border/Subtle"
   - Border Radius: 8px
   - Padding: 16px
   - Add title: "Error Rate"
   - Add chart area placeholder (640×336px)
   - Convert to Component: "ErrorRateChart"

2. **LatencyChart:**
   - Same structure as ErrorRateChart
   - Title: "Latency Trend (P50/P90/P99)"
   - Add legend placeholder
   - Convert to Component: "LatencyChart"

### Step 7: WorkerRevisionCard Component

1. **Create Card Base:**
   - Rectangle: 400×200px
   - Same styling as MetricCard

2. **Add Header:**
   - Auto Layout: Horizontal
   - Worker name + Status badge

3. **Add Revision Info:**
   - Two rows: Stable and Canary
   - Each with label + revision tag

4. **Add TrafficSplitBar:**
   - Instance of TrafficSplitBar component

5. **Create Variants:**
   - `Status=healthy,degraded,critical`

6. **Convert to Component:**
   - Name: "WorkerRevisionCard"

### Step 8: LogsTable Component

1. **Create Table Container:**
   - Frame: 1392×400px
   - Background: "Background/Secondary"
   - Border: 1px solid "Border/Subtle"
   - Border Radius: 8px

2. **Add Header:**
   - Search input + Filter + Export + Clear buttons
   - Auto Layout: Horizontal, 16px gap

3. **Add Table Header:**
   - Row: 1392×48px
   - Background: "Background/Subtle"
   - Columns: Time (200px), Level (120px), Message (1072px)
   - Text: "Body/Small", Weight: 600

4. **Add Table Body:**
   - Multiple rows (1392×48px each)
   - Border: 1px solid "Border/Subtle" (bottom only)
   - Font: "Mono/Medium"

5. **Create Variants:**
   - `Searchable=true,false`
   - `Filterable=true,false`
   - `AutoScroll=true,false`

6. **Convert to Component:**
   - Name: "LogsTable"

---

## 📐 SECTION 4 — Frame Creation

### Step 1: Main View Frames

1. **Navigate to:** `📐 Frames` → `Main Views` page

2. **Create Dashboard Home Frame:**
   - Frame: 1440×1024px
   - Name: "01_Dashboard_Home"
   - Background: "Background/Primary"
   - Apply 12-column layout grid (24px gutters)

3. **Build Structure:**
   - Add Topbar (1440×64px)
   - Add Status Cards Row (3 cards, 400px each)
   - Add Charts Section (2 charts, 680px each)
   - Add Logs Stream (full width, 320px height)

4. **Use Components:**
   - Replace placeholders with component instances
   - Link to design tokens

5. **Repeat for All Frames:**
   - Follow `FIGMA_FRAME_SPECIFICATIONS.md` for exact measurements
   - Create all 8 main frames

### Step 2: Modal Frames

1. **Create Modal Overlay:**
   - Rectangle: 1440×1024px
   - Background: rgba(0, 0, 0, 0.5)
   - Lock layer

2. **Create Modal Cards:**
   - Follow specifications for each modal
   - Center on overlay
   - Use component instances

3. **Create All 4 Modals:**
   - Promote Canary Modal (600×400px)
   - Rollback Revision Modal (600×400px)
   - Worker Health Diagnostics Modal (800×600px)
   - ML Explanation Modal (700×500px)

### Step 3: Mobile Frames

1. **Create Mobile Frame:**
   - Frame: 375×812px
   - Name: "Mobile_01_Dashboard"
   - Background: "Background/Primary"

2. **Build Mobile Layout:**
   - Single column
   - Stacked cards (full width)
   - Reduced padding (16px)

3. **Create All Mobile Frames:**
   - Follow mobile specifications

---

## 🔄 SECTION 5 — User Flow Prototyping

### Step 1: Create Flow Connections

1. **Navigate to:** `🔄 Flows` page

2. **Set Up Prototype:**
   - Select frame → Click "Prototype" tab
   - Add interactions

3. **Flow A — Canary Deployment Journey:**
   ```
   Dashboard → Deploy Button → Workflow Status → 
   Revision Cards → ML Decision → Promote → Success
   ```

4. **Flow B — Canary Replay:**
   ```
   Replay Page → Run Selector → Timeline → 
   ML Explanation → Logs → Comparison
   ```

5. **Flow C — Worker Deep Dive:**
   ```
   Dashboard → Worker Card → Detail Page → 
   Chart Point → Logs → Restart → Confirmation
   ```

### Step 2: Add Interactions

1. **Button Clicks:**
   - On Click → Navigate to → Target Frame
   - Transition: Instant or 200ms

2. **Hover States:**
   - On Hover → Change Property → Component State
   - Transition: 150ms

3. **Modal Triggers:**
   - On Click → Open Overlay → Modal Frame
   - Close on backdrop click

---

## ✅ SECTION 6 — Final Checklist

### Design System
- [ ] All color styles created and organized
- [ ] All text styles created and organized
- [ ] All effect styles created
- [ ] Spacing and radius documentation added

### Components
- [ ] CanaryStatusBadge with all variants
- [ ] MLDecisionChip with all variants
- [ ] TrafficSplitBar with all variants
- [ ] MetricCard with all variants
- [ ] ErrorRateChart placeholder
- [ ] LatencyChart placeholder
- [ ] WorkerRevisionCard with all variants
- [ ] LogsTable with all variants

### Frames
- [ ] All 8 main frames created
- [ ] All 4 modal frames created
- [ ] All 2 mobile frames created
- [ ] All frames use design tokens
- [ ] All frames use component instances

### Prototyping
- [ ] All user flows connected
- [ ] All interactions added
- [ ] Transitions configured

### Documentation
- [ ] Component descriptions added
- [ ] Property documentation added
- [ ] Usage examples created

### Handoff Preparation
- [ ] Dev Mode enabled
- [ ] Component specs exported
- [ ] Design tokens documented
- [ ] CSS/Tailwind mappings added

---

## 🚀 SECTION 7 — Export & Handoff

### Step 1: Prepare for Development

1. **Enable Dev Mode:**
   - Click "Dev Mode" toggle (top right)
   - Or press `Shift + D`

2. **Add Component Descriptions:**
   - Select component → Right panel → Add description
   - Include usage notes and props

3. **Export Assets (if needed):**
   - Select icons/images
   - Right-click → "Export"
   - Choose format (SVG, PNG, etc.)

### Step 2: Share with Team

1. **Share File:**
   - Click "Share" button
   - Set permissions (View, Edit, etc.)
   - Copy share link

2. **Create Handoff Document:**
   - Reference: `FIGMA_BLUEPRINT.md` Section 5
   - Component → Code mappings
   - Token → Tailwind mappings

### Step 3: Developer Handoff

1. **Provide Access:**
   - Share Figma file link
   - Provide design tokens JSON
   - Share component specifications

2. **Code Mappings:**
   - Use Section 5 of `FIGMA_BLUEPRINT.md`
   - Map Figma components to React components
   - Map tokens to Tailwind classes

---

## 📚 Additional Resources

### Figma Shortcuts
- `Cmd/Ctrl + /` → Quick actions
- `Shift + D` → Toggle Dev Mode
- `Option + Drag` → Duplicate
- `Cmd/Ctrl + G` → Group
- `Cmd/Ctrl + Alt + K` → Create Component

### Best Practices
1. **Naming Convention:**
   - Components: PascalCase
   - Variants: kebab-case
   - Frames: Descriptive names with numbers

2. **Organization:**
   - Use consistent layer naming
   - Group related elements
   - Use Auto Layout for flexibility

3. **Performance:**
   - Limit component nesting (max 3 levels)
   - Use constraints wisely
   - Optimize large frames

4. **Accessibility:**
   - Ensure color contrast (4.5:1 minimum)
   - Add descriptions to interactive elements
   - Test with screen readers

---

**Status:** ✅ Complete Figma Library Assembly Guide Generated
**Ready for:** Step-by-step Figma implementation

**Estimated Time:** 8-12 hours for complete assembly
**Difficulty:** Intermediate to Advanced
