# Phase 3 — Screen Blueprint Generator Prompts

## 🎯 Delegation Prompts for Screen Blueprint Generator

Use these prompts with the **Magnus Screen Blueprint Generator** agent to enhance the affiliate portal screens.

---

### DELEGATE-TO-AGENT: Screen Blueprint Generator — AffiliateOverview

**Agent**: Magnus Screen Blueprint Generator  
**Prompt to paste**:

```
Generate screen blueprint for AffiliateOverview

Screen Location: apps/web/app/(dashboard)/affiliate/page.tsx

Requirements:
- Main affiliate dashboard overview
- Display key metrics (Total Earnings, Total Clicks, Conversion Rate, Active Links)
- Quick action cards linking to Links, Earnings, and Creatives sections
- Recent links activity feed
- Top performers summary

Layout Structure:
- Use AppShell wrapper (already implemented)
- Use PageHeader component (already implemented)
- Metrics grid (4 columns on desktop, responsive)
- Quick actions grid (3 cards)
- Recent activity section

Components to Generate/Enhance:
- apps/web/app/(dashboard)/affiliate/components/AffiliateOverviewContent.tsx (enhance)
- apps/web/app/(dashboard)/affiliate/components/AffiliateQuickStats.tsx (enhance)
- Consider creating: AffiliateTopPerformers.tsx section component

Design Tokens:
- Use tokens from packages/ui/theme/tokens.ts
- Colors: success for earnings, primary for conversion rate
- Spacing: semantic spacing tokens
- Typography: text-h1, text-h2, text-body-m, text-body-s

Motion:
- Add subtle fade-in animations for metrics cards
- Stagger animations for quick action cards

Generate:
1. Enhanced AffiliateOverviewContent with better layout
2. AffiliateTopPerformers section component
3. Screen hierarchy report
```

---

### DELEGATE-TO-AGENT: Screen Blueprint Generator — AffiliateLinks

**Agent**: Magnus Screen Blueprint Generator  
**Prompt to paste**:

```
Generate screen blueprint enhancement for AffiliateLinks

Screen Location: apps/web/app/(dashboard)/affiliate/links/page.tsx

Current State:
- Uses AppShell + PageHeader (already implemented)
- Has AffiliateLinkTable component
- Has MetricsSummaryBar component

Enhancements Needed:
- Add filters (status, date range, campaign)
- Add bulk actions (pause/activate multiple links)
- Add link creation modal/drawer
- Enhance table with sorting and pagination
- Add export functionality

Section Components to Generate:
- apps/web/app/(dashboard)/affiliate/links/components/AffiliateLinksFilters.tsx
- apps/web/app/(dashboard)/affiliate/links/components/CreateLinkModal.tsx
- apps/web/app/(dashboard)/affiliate/links/components/BulkActionsBar.tsx

Layout Structure:
- PageHeader with "Create Link" action
- MetricsSummaryBar
- Filters bar (below metrics)
- Bulk actions bar (when links selected)
- AffiliateLinkTable with enhanced features
- Pagination footer

Design Tokens:
- Use tokens from packages/ui/theme/tokens.ts
- Filter inputs use Input component variants
- Action buttons use Button variants
- Status badges use Badge component

Generate:
1. Filter component with status, date, campaign filters
2. Create link modal/drawer component
3. Bulk actions bar component
4. Enhanced table with sorting
5. Screen hierarchy report
```

---

### DELEGATE-TO-AGENT: Screen Blueprint Generator — AffiliateEarnings

**Agent**: Magnus Screen Blueprint Generator  
**Prompt to paste**:

```
Generate screen blueprint enhancement for AffiliateEarnings

Screen Location: apps/web/app/(dashboard)/affiliate/earnings/page.tsx

Current State:
- Uses AppShell + PageHeader (already implemented)
- Has EarningsChart component
- Has MetricsSummaryBar component
- Period filter buttons (7d, 30d, 90d, all)

Enhancements Needed:
- Enhanced chart visualization (integrate Recharts)
- Earnings breakdown by link/creative
- Payout history table
- Export earnings report functionality
- Date range picker (custom range option)

Section Components to Generate:
- apps/web/app/(dashboard)/affiliate/earnings/components/EarningsBreakdown.tsx
- apps/web/app/(dashboard)/affiliate/earnings/components/PayoutHistoryTable.tsx
- apps/web/app/(dashboard)/affiliate/earnings/components/DateRangePicker.tsx

Layout Structure:
- PageHeader with "Export Report" action
- MetricsSummaryBar (4 metrics)
- Period filter buttons + custom range picker
- EarningsChart (enhanced with Recharts)
- Earnings breakdown cards (top performers)
- Payout history table
- Recent transactions list

Design Tokens:
- Use tokens from packages/ui/theme/tokens.ts
- Chart colors from tokens.chart.*
- Success colors for earnings
- Warning colors for pending payouts

Chart Integration:
- Use Recharts library (already in dependencies)
- Line chart for earnings over time
- Bar chart for breakdown by source
- Responsive chart sizing

Generate:
1. Enhanced EarningsChart with Recharts integration
2. EarningsBreakdown section component
3. PayoutHistoryTable component
4. DateRangePicker component
5. Screen hierarchy report
```

---

## 📋 Usage Instructions

1. **Open the Magnus Screen Blueprint Generator agent** in Cursor
2. **Paste the prompt** for the screen you want to enhance
3. **Review the generated components** and integrate them
4. **Update imports** in the main page files
5. **Test the enhanced screens**

---

## ✅ Expected Outputs

Each prompt will generate:
- Enhanced section components
- Screen hierarchy report
- Integration instructions
- Design token usage validation

---

**Ready to enhance affiliate screens!** 🚀
