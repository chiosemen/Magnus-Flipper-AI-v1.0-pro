# Sprint 1 — Testing & Validation Guide

## 🎯 Overview

This guide provides step-by-step instructions for testing and validating Sprint 1 Frontend Pass work, including data integration.

---

## ✅ Pre-Testing Checklist

Before running tests, ensure:

- [ ] Environment variables are set:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- [ ] Database tables exist:
  - `deal_scores`
  - `listings_raw`
  - `scraper_health`

- [ ] Development server is running: `pnpm dev`

- [ ] User is authenticated (for API routes)

---

## 🧪 Manual Testing Steps

### 1. Dashboard Page (`/dashboard`)

**Test Cases**:
1. **Load Dashboard**
   - Navigate to `/dashboard`
   - ✅ Should show loading skeleton
   - ✅ Should display stats cards (Active Deals, Monthly ROI, Alerts)
   - ✅ Should display marketplace status grid
   - ✅ Should show quick actions

2. **Error Handling**
   - Temporarily break API route
   - ✅ Should show error message
   - ✅ Should show retry button

3. **Empty States**
   - Test with user who has no deals
   - ✅ Should show 0 values gracefully

### 2. Deals List Page (`/deals`)

**Test Cases**:
1. **Load Deals List**
   - Navigate to `/deals`
   - ✅ Should show loading skeleton
   - ✅ Should display deals table
   - ✅ Should show correct data (title, marketplace, prices, profit, margin)

2. **Empty State**
   - Test with user who has no deals
   - ✅ Should show "No deals found" message
   - ✅ Should show "Add Your First Deal" button

3. **Navigation**
   - Click on a deal title
   - ✅ Should navigate to `/deals/[id]`

### 3. Deal Detail Page (`/deals/[id]`)

**Test Cases**:
1. **Load Deal Detail**
   - Navigate to `/deals/[id]` with valid ID
   - ✅ Should show loading skeleton
   - ✅ Should display deal information
   - ✅ Should show financial summary
   - ✅ Should show metadata

2. **404 Handling**
   - Navigate to `/deals/invalid-id`
   - ✅ Should show 404 page

3. **Links**
   - Click buy link
   - ✅ Should open in new tab

### 4. API Routes

**Test Cases**:
1. **GET /api/deals**
   - ✅ Should return 401 if not authenticated
   - ✅ Should return deals array if authenticated
   - ✅ Should support pagination (limit/offset)

2. **GET /api/deals/[id]**
   - ✅ Should return 401 if not authenticated
   - ✅ Should return deal object if authenticated
   - ✅ Should return 404 if deal not found

3. **GET /api/dashboard/stats**
   - ✅ Should return 401 if not authenticated
   - ✅ Should return stats object if authenticated

---

## 🤖 Automated Testing (Delegation Prompts)

### Use UI Layout Auditor

**Prompt**: See `docs/SPRINT_1_DELEGATION_PROMPTS.md` → UI Layout Auditor section

**What it validates**:
- Token usage consistency
- Hardcoded values
- Layout hierarchy
- Responsive breakpoints
- Dark mode support

### Use UI Component Test Generator

**Prompt**: See `docs/SPRINT_1_DELEGATION_PROMPTS.md` → UI Component Test Generator section

**What it generates**:
- Jest/Vitest test files
- React Testing Library tests
- Component rendering tests
- Interaction tests
- Accessibility tests

---

## 🔍 Code Review Checklist

### Layout Components
- [ ] All components use design tokens (no hardcoded colors)
- [ ] Components are properly typed
- [ ] Components have proper accessibility attributes
- [ ] Components handle edge cases (empty states, errors)

### Pages
- [ ] Pages use AppShell layout
- [ ] Pages use PageHeader component
- [ ] Pages have loading states
- [ ] Pages have error handling
- [ ] Pages use Suspense correctly

### API Routes
- [ ] Routes check authentication
- [ ] Routes handle errors gracefully
- [ ] Routes return proper status codes
- [ ] Routes transform data correctly
- [ ] Routes have proper TypeScript types

### Data Flow
- [ ] Data flows correctly: Page → API → Database → API → Page
- [ ] Loading states appear at correct times
- [ ] Error states appear when API fails
- [ ] Empty states appear when no data

---

## 🐛 Common Issues & Solutions

### Issue: API routes return 401
**Solution**: Ensure user is authenticated. Check Supabase auth setup.

### Issue: Data not loading
**Solution**: 
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Check database tables exist
- Check API routes are accessible
- Check browser console for errors

### Issue: Loading states not showing
**Solution**: Ensure Suspense boundaries are properly set up.

### Issue: TypeScript errors
**Solution**: Check types match between API responses and page components.

---

## 📊 Test Coverage Goals

- **Components**: 80%+ coverage
- **Pages**: 70%+ coverage
- **API Routes**: 90%+ coverage
- **Layout Components**: 100% coverage

---

## ✅ Success Criteria

Sprint 1 is considered complete when:

- ✅ All pages load without errors
- ✅ All API routes work correctly
- ✅ Loading states appear correctly
- ✅ Error states appear correctly
- ✅ Empty states appear correctly
- ✅ Data displays correctly
- ✅ Navigation works correctly
- ✅ Layout Auditor passes
- ✅ Test Generator creates comprehensive tests
- ✅ All components use design tokens
- ✅ No hardcoded colors remain

---

**Ready to test?** Start with manual testing, then run the delegation prompts for automated validation.
