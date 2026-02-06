**Task: TASK-005-ACTION-NAMING-AND-STACK-TRACES**

**Reference:** PRD-001 (Success Metrics: Clear atom naming, Stack traces available), ADR-001 (Action metadata tracking)

**Objective:** Implement configurable action naming and stack trace capture for enhanced debugging experience.

**Requirements:**

1. **Action Naming System**
   - Default naming: `ATOM_UPDATE/${atomName}`
   - Configurable naming patterns via `actionNamingStrategy`
   - Support custom action creators for user-defined names
   - Include metadata: atom type, update type (direct/computed)

2. **Stack Trace Integration**
   - Capture stack traces on development builds only
   - Configurable trace depth (default: 10 frames)
   - Source map support for readable traces
   - Performance-optimized trace capture (lazy evaluation)

3. **Action Creator API**
   - `createAction(name: string, metadata?: object)` helper
   - Support for action grouping (batched updates)
   - Type-safe action metadata with TypeScript
   - Integration with store's `set()` method

4. **Configuration System**
   - `enableStackTrace: boolean` (default: false)
   - `traceLimit: number` (default: 10)
   - `actionNaming: 'auto' | 'custom' | ((atom, value) => string)`
   - Development vs production mode detection

5. **Performance Considerations**
   - Stack trace capture only when explicitly enabled
   - Lazy stack trace generation (on-demand)
   - Production builds strip stack trace code entirely
   - Minimal overhead for action naming

6. **Developer Experience**
   - Meaningful default action names in DevTools
   - Clickable source links in stack traces
   - Action grouping for related updates
   - Custom metadata attachment capability

7. **Integration Points**
   - Integrate with store's set() method
   - Connect to DevTools plugin for trace display
   - Support SSR (no stack traces in server)
   - Work with time travel system

8. **Testing Requirements**
   - 100% test coverage for action naming system
   - Fixtures: `action-scenarios.ts` with various naming strategies
   - Stack trace capture tests (mock Error.stack)
   - Performance tests for trace capture overhead
   - Cross-browser compatibility tests

9. **SRP Compliance**
   - Action naming separate from store logic
   - Stack trace capture independent of action dispatch
   - Configuration management as separate module
   - DevTools formatting separate from action creation

**Deliverables:**

- `src/utils/action-naming.ts`
- `src/utils/stack-tracer.ts`
- `src/utils/action-creator.ts`
- `src/config/devtools-config.ts`
- `tests/unit/action-system.test.ts`
- `tests/fixtures/action-scenarios.ts`
- `tests/performance/trace-capture.test.ts`

**Success Criteria:**

- Action names clearly identify atom updates in DevTools
- Stack traces available when enabled (development only)
- Performance impact: < 1ms overhead per action with traces
- Production bundle excludes stack trace code completely
- All tests pass with 100% coverage
