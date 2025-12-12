# Magnus Sprint Orchestrator — Quick Start Guide

The **Magnus Sprint Orchestrator** is your central command center for coordinating all 8 sprint phases and specialized agents.

## 🚀 Quick Start

### How to Access the Agent

**Easiest Method:** Open Cursor Chat (`Cmd+L` / `Ctrl+L`) and type one of the trigger phrases below. The agent will automatically activate!

**Alternative Methods:**
- **Settings**: `Cursor` → `Settings` → Search for "Agents"
- **Command Palette**: `Cmd+Shift+P` → Type "agent"
- **Direct**: The agent file is at `.cursor/agents/magnus-sprint-orchestrator.json`

> 💡 **Tip**: Cursor agents work automatically when you use their trigger phrases in chat. No manual activation needed!

### Getting Started

1. **Open Cursor Chat** (`Cmd+L` / `Ctrl+L`)
2. **Paste one of the prompts below** to get started

---

## 📋 Ready-to-Use Orchestration Prompts

### Full Frontend Pass (Phases 1-3)

```
Start Sprint Execution — Full Frontend Pass

Coordinate Phases 1-3:
- Phase 1: Figma System → Tokens → Base UI Kit
- Phase 2: Tailwind Theme + UI Kit Integration  
- Phase 3: Affiliate Portal build-out

Inspect current state, create a comprehensive plan, and begin execution.
Prioritize foundation work (tokens, theme) before building features.
```

### Production Readiness Orchestration (Phase 8)

```
Start Sprint Execution — Phase 8: Production Readiness Suite

Coordinate:
- CI/CD pipelines for web/api/workers/mobile
- Selenium QA, smoke tests, health checks
- Canary deployments + dashboards
- Observability hooks & alarms

Inspect existing .github/workflows, qa/selenium, and infra/azure.
Generate comprehensive production readiness plan and begin implementation.
```

### Feed & Real-time Backend (Phase 4)

```
Start Sprint Execution — Phase 4: Feed + SSE + WebSocket

Coordinate:
- /api/search/feed (ranked)
- /api/search/realtime (SSE)
- WebSockets from workers → web/mobile
- End-to-end smoke tests

Inspect current API structure, worker architecture, and Supabase realtime setup.
Create implementation plan and begin execution.
```

### Mobile Performance Optimization (Phase 7)

```
Start Sprint Execution — Phase 7: Mobile Performance Optimization

Coordinate:
- Hermes optimization
- Caching strategy
- Offline modes
- Bundle size management
- Shared UI contracts consistency

Inspect apps/mobile structure, use Component Contract Enforcer for web/mobile parity.
Generate performance optimization plan and begin execution.
```

### Scraper Performance Tuning (Phase 6)

```
Start Sprint Execution — Phase 6: Scraper Battle Pack

Coordinate:
- Swoopa Emulation Mode
- Velocity ranking
- ListingFingerprint v2
- Observability metrics

Inspect apps/worker-realtime, apps/worker-scheduler, and packages/marketplace-config.
Create performance tuning plan and begin execution.
```

### Compliance Shield Integration (Phase 5)

```
Start Sprint Execution — Phase 5: Compliance Shield Integration

Coordinate:
- packages/compliance-shield behavior
- Marketplace profiles v2.0 → risk tiers, delays
- Throttling + heuristic logic + observability

Inspect existing compliance-shield package and worker/API integration points.
Create integration plan and begin execution.
```

### Resume at Specific Step

```
Resume Phase 2 at Tailwind wiring step

Inspect current state of:
- apps/web/tailwind.config.ts
- packages/ui/tailwind-preset.js
- Component token usage

Continue from Tailwind theme integration point.
```

### Multi-Phase Coordination

```
Orchestrate a full flow for affiliate dashboard

Coordinate Phases 1-3:
- Ensure Phase 1 tokens/base components are ready
- Verify Phase 2 theme integration is complete
- Build Phase 3 affiliate portal features

Inspect dependencies, create comprehensive plan, execute in correct order.
```

### Status Check & Next Steps

```
Plan next steps for Magnus Flipper sprint

Assess current state across all 8 phases.
Identify:
- Completed work
- In-progress work
- Blocked dependencies
- Recommended next priorities

Generate prioritized action plan.
```

---

## 🎯 How It Works

The Orchestrator will:

1. **Map your request** to the relevant Phase(s)
2. **Inspect the codebase** to understand current state
3. **Create a Sprint Step Plan** with 3-7 atomic tasks
4. **Decide Execute vs Delegate** for each task:
   - **EXECUTE-HERE**: Generates code patches directly
   - **DELEGATE-TO-AGENT**: Provides ready-to-paste prompts for specialized agents
5. **Output**:
   - Sprint Step Plan
   - Code patches/config changes
   - Agent prompts for delegation

---

## 🧠 Specialized Agents You Can Delegate To

The Orchestrator knows about these agents and will generate prompts for them:

1. **Phase 1 Executor** — Figma → tokens → base components
2. **Phase 2 Executor** — Tailwind theme wiring + UI Kit integration
3. **UI Component Test Generator** — Jest/Vitest + RTL tests
4. **Token Drift Detector** — Figma ↔ Tailwind ↔ UI consistency
5. **Figma → Tailwind Automation Engine** — Token synchronization scripts
6. **UI Layout Auditor** — Layout validation against architecture
7. **Component Contract Enforcer** — Web/mobile API parity
8. **Screen Blueprint Generator** — Screen generation from diagrams

---

## 📁 Monorepo Context

The Orchestrator understands:

```
apps/
  ├── web/              # Next.js 15 App Router
  ├── api/               # API / backend
  ├── worker-realtime/   # Real-time scraper workers
  ├── worker-scheduler/  # Scheduled scraper workers
  └── mobile/            # Expo/React Native

packages/
  ├── ui/                # Shared design system + components
  ├── core/              # Shared business logic
  ├── marketplace-config/
  ├── rate-limiter/
  ├── compliance-shield/
  └── feed-emitter/

infra/azure/             # Terraform / Azure Container Apps
scripts/                 # Utility scripts
design/                  # Figma exports / token JSON
qa/selenium/             # Selenium test suite
```

---

## 💡 Pro Tips

1. **Be Specific**: The more specific your request, the better the plan
2. **Check Dependencies**: The Orchestrator will warn if earlier phases need completion
3. **Review Plans**: Always review the Sprint Step Plan before execution
4. **Use Delegation**: Let specialized agents handle their domains
5. **Iterate**: You can resume or refine plans as you go

---

## 🔄 Example Workflow

```
User: "Start Sprint Execution — Phase 1"

Orchestrator:
1. Inspects packages/ui structure
2. Checks for existing tokens/theme files
3. Creates Sprint Step Plan
4. Generates code patches for missing pieces
5. Provides Phase 1 Executor prompt for Figma extraction

User: "Resume Phase 2 at Tailwind wiring step"

Orchestrator:
1. Checks Phase 1 completion status
2. Inspects Tailwind configs
3. Patches tailwind.config.ts
4. Generates Token Drift Detector prompt
5. Updates component token usage
```

---

## 🆘 Troubleshooting

**Q: The Orchestrator isn't generating code patches?**  
A: Make sure your request is actionable. Use trigger phrases like "Start Sprint Execution" or "Resume Phase X".

**Q: How do I know which agent to delegate to?**  
A: The Orchestrator will decide automatically and provide the exact prompt to paste into the specialized agent.

**Q: Can I run multiple phases at once?**  
A: Yes! The Orchestrator will coordinate dependencies and execution order.

**Q: What if a phase is partially complete?**  
A: The Orchestrator will inspect current state and resume from where you left off.

---

**Ready to orchestrate?** Paste one of the prompts above into the Magnus Sprint Orchestrator agent! 🚀
