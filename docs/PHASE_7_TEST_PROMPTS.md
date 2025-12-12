# Phase 7 — Mobile Performance — Test Generation Prompts

## 🎯 Delegation Prompts for Testing Agents

---

### DELEGATE-TO-AGENT: Mobile Performance Test Generator

**Agent**: Magnus Mobile Test Generator  
**Prompt to paste**:

```
Generate tests for Phase 7 Mobile Performance enhancements

Create Jest/React Native Testing Library tests for:

1. Performance Libraries:
   - performance.ts (apps/mobile/lib/performance.ts)
   - cache-enhanced.ts (apps/mobile/lib/cache-enhanced.ts)
   - offline-enhanced.ts (apps/mobile/lib/offline-enhanced.ts)
   - bundleSize.ts (apps/mobile/lib/bundleSize.ts)

2. Performance Hooks:
   - useMobilePerformance (apps/mobile/hooks/useMobilePerformance.ts)

3. Performance Components:
   - PerformanceMonitor (apps/mobile/components/PerformanceMonitor.tsx)

4. UI Contracts Adapters:
   - ui-contracts-adapter.ts (apps/mobile/lib/ui-contracts-adapter.ts)

Test coverage should include:
- Performance metrics collection
- Cache operations (get, set, remove, clear)
- Cache eviction logic
- Offline mode functionality
- Mutation queue operations
- Network status monitoring
- Bundle size analysis
- UI contract adapter functionality
- Contract validation
- Error handling
- Memory management

Place tests in apps/mobile/__tests__/ following the same directory structure.
```

---

### DELEGATE-TO-AGENT: Integration Tests

**Agent**: Magnus Test Generator  
**Prompt to paste**:

```
Generate integration tests for Phase 7 Mobile Performance

Test scenarios:

1. Cache Management:
   - Verify cache get/set operations
   - Verify cache eviction when size limit reached
   - Verify TTL expiration
   - Verify cache statistics calculation
   - Verify cache clearing

2. Offline Mode:
   - Verify mutation queue operations
   - Verify network status detection
   - Verify auto-sync on reconnection
   - Verify offline status tracking
   - Verify error handling

3. Performance Monitoring:
   - Verify performance metrics collection
   - Verify memory usage tracking
   - Verify render time measurement
   - Verify performance hook updates

4. Bundle Size:
   - Verify bundle size analysis
   - Verify module breakdown
   - Verify recommendations generation

5. UI Contracts:
   - Verify Button adapter functionality
   - Verify Card adapter functionality
   - Verify Input adapter functionality
   - Verify contract validation

Generate test files:
- apps/mobile/__tests__/lib/performance.test.ts
- apps/mobile/__tests__/lib/cache-enhanced.test.ts
- apps/mobile/__tests__/lib/offline-enhanced.test.ts
- apps/mobile/__tests__/hooks/useMobilePerformance.test.ts
```

---

## 📋 Usage Instructions

1. **Open the specified agent** in Cursor
2. **Paste the prompt** exactly as shown above
3. **Review the output** and apply suggested fixes
4. **Update Phase 7 status** based on test results

---

## ✅ Expected Outcomes

- **Test Generator**: Comprehensive test suite with good coverage
- **Integration Tests**: Full integration test suite

---

**Ready for testing and validation!** 🧪
