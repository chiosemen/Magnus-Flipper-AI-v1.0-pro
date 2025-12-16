# ADR-056: Tech Trade Feature Branch Strategy

## Status

Accepted

## Context

Tech Trade is a large feature requiring multiple sprints to complete. During development, we need to:
- Keep the main branch stable and deployable
- Allow incremental progress on the feature
- Enable code review and testing
- Support parallel work by multiple contributors

The question is how to manage the codebase during this extended development period.

## Decision

We will use a **long-lived feature branch** with the following practices:

### Branch Structure

```
main (production-ready)
  └── feat/magnus-tech-trade-market (feature development)
        ├── Phase 0: Branch initialization
        ├── Phase 1: Technical design
        ├── Phase 2: Design review
        ├── Phase 3: Subsystem specs
        ├── Phase 4: Sprint planning
        ├── Phase 5A: Tests (TDD)
        ├── Phase 5B: Implementation
        ├── Phase 6: Code review
        ├── Phase 7: Integration tests
        └── Phase 8: ADRs
```

### Merge Strategy

1. **Feature branch → main**: Squash merge after all phases complete
2. **main → feature branch**: Rebase regularly to stay current
3. **No direct commits to main**: All changes via PR

### Approval Gates

Each phase requires explicit human approval before proceeding:

| Phase | Deliverable | Approval Criteria |
|-------|-------------|-------------------|
| 0 | Branch | Clean working tree |
| 1 | TDD | Design reviewed |
| 2 | Review | Issues addressed |
| 3 | Specs | Subsystems defined |
| 4 | Backlog | Sprint plan approved |
| 5A | Tests | Tests written |
| 5B | Code | All tests passing |
| 6 | Review | Critical fixes applied |
| 7 | Integration | System validated |
| 8 | ADRs | Decisions documented |

### Commit Conventions

```
feat(tech-trade): add pricing engine core logic
test(tech-trade): add unit tests for anchor blending
docs(tech-trade): add ADR-051 pricing engine architecture
fix(tech-trade): handle edge case in policy floor
```

## Consequences

### Positive

1. **Main branch stability**: Production deployments unaffected
2. **Clear progress tracking**: Phases provide milestones
3. **Isolated development**: Tech Trade changes contained
4. **Review opportunity**: Each phase can be reviewed
5. **Rollback safety**: Can abandon feature without affecting main

### Negative

1. **Merge conflicts**: Long-lived branch may diverge
2. **Integration risk**: Large merge at the end
3. **Delayed feedback**: Changes not in production during development
4. **Branch management**: Must keep rebased on main

### Mitigations

- Rebase on main at least weekly
- Run CI on feature branch
- Break into smaller PRs within feature branch
- Regular sync meetings to catch integration issues early

## Alternatives Considered

### Alternative 1: Trunk-Based Development

**Rejected** because:
- Feature is too large for single-day integration
- Would require extensive feature flags
- Risk of incomplete feature in production

### Alternative 2: Multiple Feature Branches

**Rejected** because:
- Coordination overhead
- Harder to maintain consistency
- Integration testing more complex

### Alternative 3: Fork and PR

**Rejected** because:
- Unnecessary for internal development
- Harder to share work in progress
- CI/CD configuration complexity

## Merge Checklist

Before merging `feat/magnus-tech-trade-market` into `main`:

- [ ] All 8 phases completed and approved
- [ ] All tests passing (242+ tests)
- [ ] No linting errors
- [ ] Documentation complete
- [ ] ADRs reviewed
- [ ] Rebased on latest main
- [ ] Squash commits for clean history
- [ ] Deployment plan reviewed

## References

- [SPRINT_PLAN.md](../tech-trade/SPRINT_PLAN.md)
- [CODE_REVIEW_CHECKLIST.md](../tech-trade/CODE_REVIEW_CHECKLIST.md)

