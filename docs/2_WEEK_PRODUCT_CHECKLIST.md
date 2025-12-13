# 📅 2-Week Product Development Checklist

**Start Date:** 2025-12-12  
**End Date:** 2025-12-26

---

## Week 1 (Dec 12-18)

### Day 1-2: Setup & Orientation
- [ ] Review [BACK_TO_PRODUCT_PLAN.md](./BACK_TO_PRODUCT_PLAN.md)
- [ ] Verify local build: `pnpm --filter <your-app> build`
- [ ] Check CI status on `main` branch
- [ ] Identify first product feature to build
- [ ] Create feature branch

### Day 3-5: Development Sprint
- [ ] Build feature (follow product checklist)
- [ ] Run local builds before each commit
- [ ] Create PR with proper title/description
- [ ] Ensure no infrastructure files touched
- [ ] Get code review

### Day 6-7: Review & Adjust
- [ ] Review Week 1 PR patterns
- [ ] Check for any infrastructure drift
- [ ] Adjust guardrails if needed
- [ ] Plan Week 2 features

**Week 1 Goals:**
- ✅ 2-3 product PRs merged
- ✅ Zero infrastructure changes
- ✅ All PRs pass CI
- ✅ Team comfortable with boundaries

---

## Week 2 (Dec 19-25)

### Day 8-10: Continued Development
- [ ] Continue product feature work
- [ ] Maintain PR hygiene (focused, small)
- [ ] Monitor CI stability
- [ ] Document any edge cases encountered

### Day 11-12: Feature Completion
- [ ] Complete in-progress features
- [ ] Ensure all PRs merged or in review
- [ ] Test features in staging (if applicable)
- [ ] Document learnings

### Day 13-14: Review & Planning
- [ ] **Full transition review:**
  - [ ] Count product PRs merged (target: 5+)
  - [ ] Count infrastructure PRs (target: 0, unless emergency)
  - [ ] Review CI stability metrics
  - [ ] Assess team confidence
- [ ] **Decide next steps:**
  - [ ] Continue product focus?
  - [ ] Plan DeployGuardian re-enablement?
  - [ ] Address any accumulated tech debt?
- [ ] **Update documentation:**
  - [ ] Update BACK_TO_PRODUCT_PLAN.md with learnings
  - [ ] Adjust frozen areas if needed
  - [ ] Document any new patterns

**Week 2 Goals:**
- ✅ 3-4 more product PRs merged
- ✅ Zero infrastructure regressions
- ✅ Clear path forward established
- ✅ Team fully in product mode

---

## Daily Standup Questions

**For each day, ask:**
1. What product feature am I building today?
2. Am I touching any infrastructure files? (Should be NO)
3. Will my PR be < 500 lines? (Should be YES)
4. Have I run local builds? (Should be YES)

---

## Weekly Metrics to Track

### Infrastructure Health
- CI failure rate (target: 0%)
- Infrastructure file change count (target: 0)
- DeployGuardian re-enablement attempts (target: 0)

### Product Velocity
- PRs merged per week (target: 2-3)
- Average PR size (target: < 500 lines)
- Time to merge (target: < 2 days)

### Team Confidence
- Questions about boundaries (target: decreasing)
- Accidental infrastructure changes (target: 0)
- Blocked work (target: 0)

---

## Red Flags (Stop and Review)

If you see any of these, pause and review:
- ❌ Multiple infrastructure file changes in one PR
- ❌ CI failures that seem infrastructure-related
- ❌ Questions about "can I change X?" (X is in frozen list)
- ❌ PRs that touch both product and infrastructure
- ❌ Build system changes "to make product work easier"

**Action:** Review [BACK_TO_PRODUCT_PLAN.md](./BACK_TO_PRODUCT_PLAN.md) and adjust approach.

---

## Success Criteria (End of 2 Weeks)

### Must Have
- ✅ 5+ product PRs merged
- ✅ Zero infrastructure PRs (unless emergency)
- ✅ All PRs pass CI
- ✅ No infrastructure regressions
- ✅ Team understands boundaries

### Nice to Have
- ✅ 10+ product PRs merged
- ✅ Features deployed to staging/production
- ✅ Clear product roadmap for next sprint
- ✅ Team fully confident in product mode

---

## Notes Section

_Use this space to track learnings, adjustments, and decisions:_

**Week 1 Notes:**
- 

**Week 2 Notes:**
- 

**Adjustments Made:**
- 

**Key Learnings:**
- 

---

**Last Updated:** 2025-12-12  
**Next Review:** 2025-12-26

