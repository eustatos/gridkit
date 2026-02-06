**Task: TASK-001-IMPLEMENT-ATOM-REGISTRY**

**Reference:** ADR-001 (Option A - Store Method Interception with atomic registry), PRD-001 (Goal: Display meaningful atom names)

**Objective:** Create global atom registry system for DevTools integration and time travel support.

**Requirements:**

1. **Global Registry Singleton**
   - Create `AtomRegistry` class with static access
   - Use `Map<symbol, Atom<any>>` for storage
   - Thread-safe for SSR environments

2. **Atom Registration**
   - Modify existing `atom()` function to auto-register atoms
   - Add optional `name` parameter to `atom()` for DevTools display
   - Generate fallback names (atom-1, atom-2) when no name provided

3. **Registry API**
   - `register(atom: Atom, name?: string): void`
   - `get(id: symbol): Atom | undefined`
   - `getName(atom: Atom): string`
   - `getAll(): Map<symbol, Atom>`
   - `clear(): void` (for testing)

4. **Atom Metadata**
   - Store creation timestamp
   - Store optional display name
   - Track atom type (primitive, computed, writable)

5. **Integration Points**
   - Registry initialized on first import
   - Automatically registers all created atoms
   - No manual registration required by users

6. **Performance Considerations**
   - Minimal memory overhead
   - Fast lookup by symbol
   - Weak references not used (atoms need to persist)

7. **Testing Requirements**
   - 100% test coverage for AtomRegistry
   - Fixtures: create `test-atoms.ts` with sample atom configurations
   - Test concurrent access scenarios
   - Verify no memory leaks

8. **SRP Compliance**
   - Registry only manages atom storage and lookup
   - No business logic for state management
   - No DevTools-specific code in registry

9. **Error Handling**
   - Graceful handling of duplicate registrations
   - Clear error messages for registry misuse
   - Safe defaults for missing atoms

**Deliverables:**

- `src/core/atom-registry.ts`
- `tests/unit/atom-registry.test.ts`
- `tests/fixtures/test-atoms.ts`
- Updated `atom()` function in `src/core/atom.ts`
- Documentation update for atom naming feature

**Success Criteria:**

- All atoms automatically registered
- Registry lookup performance O(1)
- No breaking changes to existing API
- All tests pass with 100% coverage
- Memory usage within acceptable limits
