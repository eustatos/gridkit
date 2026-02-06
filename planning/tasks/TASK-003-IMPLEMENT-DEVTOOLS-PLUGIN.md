**Task: TASK-003-IMPLEMENT-DEVTOOLS-PLUGIN**

**Reference:** ADR-001 (DevTools Plugin Structure), PRD-001 (User Stories: See all atom changes in DevTools)

**Objective:** Create Redux DevTools plugin for state monitoring and time travel capabilities.

**Requirements:**

1. **Plugin Architecture**
   - Implement `DevToolsPlugin` class implementing `Plugin` interface
   - Configurable via `DevToolsConfig` object
   - Support multiple DevTools instances for multiple stores

2. **Redux DevTools Integration**
   - Detect `window.__REDUX_DEVTOOLS_EXTENSION__` availability
   - Graceful fallback when extension not present
   - Support both Chrome extension and npm package versions

3. **State Change Communication**
   - Send atom updates to DevTools with meaningful action names
   - Include atom metadata (name, type, timestamp)
   - Batch rapid updates to prevent performance issues
   - Handle large state payloads efficiently

4. **Initialization Sequence**
   - Connect to DevTools on store creation
   - Send initial state snapshot
   - Setup message listeners for DevTools commands

5. **Configuration Options**
   - `name`: Store name displayed in DevTools
   - `trace`: Enable stack traces (default: false)
   - `latency`: Update debounce time (default: 100ms)
   - `maxAge`: Max actions in history (default: 50)

6. **Message Handling**
   - Listen to DevTools `DISPATCH` messages
   - Handle `JUMP_TO_ACTION`, `JUMP_TO_STATE` commands
   - Support `IMPORT_STATE`, `COMMIT`, `RESET` operations
   - Validate incoming messages for security

7. **Error Handling**
   - Recover from DevTools connection failures
   - Handle serialization errors gracefully
   - Log warnings in development mode
   - Silent failure in production

8. **Testing Requirements**
   - 100% test coverage for DevToolsPlugin
   - Fixtures: `mock-devtools.ts` simulating extension API
   - Integration tests with actual DevTools messages
   - Network failure simulation tests

9. **SRP Compliance**
   - Plugin only handles DevTools communication
   - No atom state management logic
   - No UI rendering components
   - Separate concerns: communication vs. state restoration

**Deliverables:**

- `src/plugins/devtools-plugin.ts`
- `src/types/devtools-config.ts`
- `tests/unit/devtools-plugin.test.ts`
- `tests/fixtures/mock-devtools.ts`
- `tests/integration/devtools-communication.test.ts`
- Example: `examples/devtools-usage.ts`

**Success Criteria:**

- Plugin connects to Redux DevTools successfully
- All atom changes visible in DevTools interface
- Configuration options work as specified
- Graceful degradation when DevTools unavailable
- All tests pass with 100% coverage
