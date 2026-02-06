**ADR-001: DevTools Integration Architecture**

**File:** `core-001-dev-tools-integration.md`

**Related PRD:** PRD-001

---

**1. Context and Problem Statement**
We need to integrate Nexus State with Redux DevTools to provide debugging capabilities. The challenge is to intercept state changes without modifying the core API while supporting time travel.

**2. Decision Drivers**

- Zero configuration for basic usage
- No performance impact in production
- Full time travel support
- Minimal API changes
- Tree-shakeable implementation

**3. Considered Options**

**Option A: Store Method Interception**
Wrap store methods (get/set) to track changes and send to DevTools.

**Option B: Atom-Level Decorators**
Add DevTools metadata to each atom and use proxy pattern.

**Option C: EventEmitter Bridge**
Create a central event system that all atoms publish to.

**4. Decision**
Choose **Option A: Store Method Interception** with atomic registry.

**5. Rationale**

- Least intrusive to existing codebase
- Centralized control point
- Easy to implement time travel
- Can be completely removed in production
- No changes required to atom creation API

**6. Implementation Strategy**

**6.1 Core Changes**

- Add atom registry to track all created atoms
- Add store.set interception with action metadata
- Implement state serialization/deserialization

**6.2 DevTools Plugin Structure**

```typescript
interface DevToolsPlugin {
  init(store: Store): void;
  send(action: Action, state: State): void;
  receive(message: DevToolsMessage): void;
}
```

**6.3 Time Travel Support**

- Store full state snapshots on each change
- Map atom IDs to actual atom instances
- Validate state before restoration

**6.4 Performance Considerations**

- Lazy state serialization
- Batched updates for rapid changes
- Production build strips DevTools code

**7. Consequences**

**Positive:**

- Familiar debugging experience
- No API changes for users
- Works with existing Redux DevTools
- Easy to extend with custom features

**Negative:**

- Slight overhead in development mode
- Requires atom registry (memory overhead)
- Serialization limitations for non-JSON values

**8. Compliance with PRD-001**

- ✅ Zero-config integration
- ✅ Time travel debugging
- ✅ Meaningful atom names (via registry)
- ✅ Performance maintained via tree-shaking
- ✅ Familiar Redux DevTools interface

**9. Follow-up Actions**

1. Implement atom registry
2. Create DevTools plugin
3. Add configuration options
4. Write documentation
5. Create examples

**10. Notes**
Time travel for computed atoms requires re-evaluation on state restoration. We'll store computed values in snapshots and recalculate dependencies when needed.
