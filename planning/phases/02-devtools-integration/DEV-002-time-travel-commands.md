# DEV-002: Implement Time Travel Command Handling

## 🎯 Objective

Enable Redux DevTools time travel commands (JUMP_TO_STATE, JUMP_TO_ACTION, etc.) to work with the SimpleTimeTravel implementation from Phase 1, providing seamless debugging experience.

## 📋 Requirements

### Functional Requirements:

- [ ] Handle `JUMP_TO_STATE` and `JUMP_TO_ACTION` DevTools commands
- [ ] Support `IMPORT_STATE` for loading external state
- [ ] Implement `COMMIT` to create named checkpoints
- [ ] Support `RESET` to revert to initial state
- [ ] Map DevTools action IDs to SimpleTimeTravel snapshots
- [ ] Sync DevTools timeline with internal history
- [ ] Handle `ROLLBACK` to undo specific actions
- [ ] Support `SWEEP` to remove non-active actions

### Non-Functional Requirements:

- [ ] Command execution < 100ms for 1000 atom states
- [ ] Memory efficient snapshot mapping
- [ ] Error recovery for invalid commands
- [ ] Thread-safe for concurrent access
- [ ] Type-safe command handling

## 🔧 Technical Details

### Files to Create/Modify:

1. `packages/devtools/src/command-handler.ts` - DevTools command processor
2. `packages/devtools/src/snapshot-mapper.ts` - Maps DevTools actions to snapshots
3. `packages/devtools/src/devtools-plugin.ts` - Command integration
4. `packages/core/src/time-travel/types.ts` - Command type definitions
5. `packages/core/src/enhanced-store.ts` - Command API exposure

### Expected Architecture:

#### 1. CommandHandler Class:

```typescript
export class DevToolsCommandHandler {
  private timeTravel: SimpleTimeTravel;
  private snapshotMap: Map<string, string> = new Map(); // DevTools actionId -> snapshotId
  private reverseMap: Map<string, string> = new Map(); // snapshotId -> DevTools actionId

  constructor(timeTravel: SimpleTimeTravel) {
    this.timeTravel = timeTravel;
  }

  handleCommand(command: DevToolsCommand): CommandResult {
    switch (command.type) {
      case "JUMP_TO_STATE":
        return this.handleJumpToState(command.payload.actionId);

      case "JUMP_TO_ACTION":
        return this.handleJumpToAction(command.payload.actionId);

      case "IMPORT_STATE":
        return this.handleImportState(command.payload.nextLiftedState);

      case "COMMIT":
        return this.handleCommit();

      case "RESET":
        return this.handleReset();

      case "ROLLBACK":
        return this.handleRollback(command.payload.actionId);

      case "SWEEP":
        return this.handleSweep();

      default:
        return { success: false, error: `Unknown command: ${command.type}` };
    }
  }

  private handleJumpToState(actionId: string): CommandResult {
    const snapshotId = this.snapshotMap.get(actionId);
    if (!snapshotId) {
      return {
        success: false,
        error: `No snapshot found for action: ${actionId}`,
      };
    }

    const success = this.timeTravel.jumpToSnapshot(snapshotId);
    if (!success) {
      return {
        success: false,
        error: `Failed to restore snapshot: ${snapshotId}`,
      };
    }

    return { success: true };
  }
}
```

#### 2. Snapshot Mapping System:

```typescript
export class SnapshotMapper {
  private lastActionId: number = 0;

  // Map internal snapshot to DevTools action
  mapSnapshotToAction(snapshot: Snapshot, actionType: string): DevToolsAction {
    const actionId = this.generateActionId();

    return {
      type: actionType,
      timestamp: snapshot.metadata.timestamp,
      actionId,
      payload: this.extractPayload(snapshot),
      // Store mapping for reverse lookup
      _snapshotId: snapshot.id,
    };
  }

  // Extract relevant payload for DevTools display
  private extractPayload(snapshot: Snapshot): any {
    return {
      atomCount: Object.keys(snapshot.state).length,
      actionName: snapshot.metadata.actionName,
      // Optional: include changed atom names
      changedAtoms: this.getChangedAtoms(snapshot),
    };
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${++this.lastActionId}`;
  }
}
```

#### 3. DevTools Plugin Integration:

```typescript
export class DevToolsPlugin implements Plugin {
  private commandHandler: DevToolsCommandHandler;
  private snapshotMapper: SnapshotMapper;

  apply(store: EnhancedStore): void {
    // Initialize command handling
    if (store.timeTravel) {
      this.commandHandler = new DevToolsCommandHandler(store.timeTravel);
      this.snapshotMapper = new SnapshotMapper();
    }

    // Setup command listener
    this.setupCommandListener();
  }

  private setupCommandListener(): void {
    this.connection?.subscribe((message: DevToolsMessage) => {
      if (message.type === "DISPATCH") {
        const command = this.parseCommand(message);
        const result = this.commandHandler.handleCommand(command);

        if (!result.success && process.env.NODE_ENV !== "production") {
          console.warn("DevTools command failed:", result.error);
        }
      }
    });
  }

  // Map snapshot to DevTools action when sending updates
  private sendStateUpdate(state: any, snapshot: Snapshot): void {
    const action = this.snapshotMapper.mapSnapshotToAction(
      snapshot,
      snapshot.metadata.actionName || "STATE_UPDATE",
    );

    // Store mapping for time travel
    this.commandHandler.registerMapping(action.actionId, snapshot.id);

    this.connection?.send(action, state);
  }
}
```

## 🚀 Implementation Steps

### Step 1: Analyze DevTools Command Protocol (2 hours)

1. Study Redux DevTools extension message format
2. Document all supported commands and payloads
3. Create TypeScript interfaces for command types
4. Test with actual DevTools extension

### Step 2: Implement CommandHandler Class (3-4 hours)

1. Create base command handling infrastructure
2. Implement each command type (JUMP_TO_STATE, IMPORT_STATE, etc.)
3. Add error handling and validation
4. Create unit tests for each command

### Step 3: Build Snapshot Mapping System (2-3 hours)

1. Create bidirectional mapping between DevTools actions and snapshots
2. Implement payload extraction for DevTools display
3. Add incremental mapping updates
4. Handle mapping cleanup for swept actions

### Step 4: Integrate with DevTools Plugin (2 hours)

1. Modify plugin to handle command messages
2. Connect command handler to time travel instance
3. Setup message parsing and routing
4. Add command execution feedback

### Step 5: Implement State Import/Export (2 hours)

1. Create state serialization format compatible with DevTools
2. Implement `IMPORT_STATE` command handling
3. Add validation for imported state
4. Create export functionality for state sharing

### Step 6: Write Comprehensive Tests (3 hours)

1. Unit tests for each command type
2. Integration tests with mock DevTools
3. Performance tests for large state import
4. Error recovery tests for invalid commands

## 🧪 Testing Requirements

### Unit Tests:

- [ ] Each command type handled correctly
- [ ] Snapshot mapping works bidirectionally
- [ ] Error handling for invalid commands
- [ ] State import validation
- [ ] Command result reporting

### Integration Tests:

- [ ] Full command flow from DevTools to store
- [ ] Time travel synchronization
- [ ] State import/export round-trip
- [ ] Concurrent command handling

### Performance Tests:

- [ ] Command execution < 50ms for typical states
- [ ] State import < 100ms for 1000 atoms
- [ ] Mapping memory usage < 1MB per 1000 actions
- [ ] No performance regression during time travel

### Edge Cases:

- [ ] Empty state import/export
- [ ] Invalid command payloads
- [ ] Missing snapshot mappings
- [ ] Concurrent time travel operations
- [ ] Large state payloads (>10MB)

## ✅ Acceptance Criteria

### Code Quality:

- [ ] TypeScript strict mode compliance
- [ ] No `any` types in command interfaces
- [ ] 95%+ test coverage for command handling
- [ ] Comprehensive JSDoc for all commands

### Functional:

- [ ] All DevTools time travel commands work
- [ ] State import/export maintains data integrity
- [ ] Command errors reported to DevTools
- [ ] Snapshot mapping persists across sessions
- [ ] Works with both global and isolated stores

### Performance:

- [ ] Command latency < 100ms (P95)
- [ ] Memory overhead < 2MB for 1000 actions
- [ ] No UI blocking during state restoration
- [ ] Efficient mapping cleanup

## 📝 Notes for AI

### Important Implementation Details:

1. **Command Payload Structure:**

```typescript
interface DevToolsCommand {
  type: "DISPATCH";
  payload: {
    type:
      | "JUMP_TO_STATE"
      | "JUMP_TO_ACTION"
      | "IMPORT_STATE"
      | "COMMIT"
      | "RESET"
      | "ROLLBACK"
      | "SWEEP";
    timestamp?: number;
    actionId?: string;
    nextLiftedState?: any;
    // ... other command-specific fields
  };
  state?: string; // JSON string of current state
}

// Response format
interface CommandResult {
  success: boolean;
  error?: string;
  restoredState?: any;
  warnings?: string[];
}
```

2. **Snapshot Mapping Strategy:**

```typescript
// Store mapping in both directions for O(1) lookups
private updateMappings(devToolsActionId: string, snapshotId: string): void {
  this.snapshotMap.set(devToolsActionId, snapshotId);
  this.reverseMap.set(snapshotId, devToolsActionId);

  // Cleanup old mappings if we exceed limit
  if (this.snapshotMap.size > this.maxMappings) {
    this.cleanupOldMappings();
  }
}

// When DevTools sweeps actions, clean up our mappings
private handleSweep(): CommandResult {
  const sweptActions = this.getSweptActionIds(); // Need to infer from DevTools
  sweptActions.forEach(actionId => {
    const snapshotId = this.snapshotMap.get(actionId);
    if (snapshotId) {
      this.snapshotMap.delete(actionId);
      this.reverseMap.delete(snapshotId);
    }
  });

  return { success: true };
}
```

3. **State Import/Export Format:**

```typescript
interface ExportedState {
  version: '1.0';
  timestamp: number;
  storeName?: string;
  state: {
    atoms: Array<{
      id: string;
      name?: string;
      type: 'primitive' | 'computed' | 'writable';
      value: any;
    }>;
  };
  // Include computed values or mark as to-be-recomputed
  computedValues?: Record<string, any>;
  // Metadata for debugging
  metadata?: {
    atomCount: number;
    serializationTime: number;
    checksum: string;
  };
}

// Import validation
private validateImportedState(state: ExportedState): ValidationResult {
  const errors: string[] = [];

  if (state.version !== '1.0') {
    errors.push(`Unsupported version: ${state.version}`);
  }

  if (!state.state?.atoms) {
    errors.push('Invalid state format: missing atoms');
  }

  // Verify checksum if provided
  if (state.metadata?.checksum) {
    const calculated = this.calculateChecksum(state);
    if (calculated !== state.metadata.checksum) {
      errors.push('State checksum mismatch - data may be corrupted');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Integration Example:

```typescript
// Full workflow example
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  plugins: [new DevToolsPlugin()],
});

// User clicks "Jump to Action" in DevTools
// → DevTools sends JUMP_TO_ACTION command
// → Plugin receives and routes to CommandHandler
// → CommandHandler maps actionId to snapshotId
// → SimpleTimeTravel restores from snapshot
// → Store state updates
// → UI re-renders with historical state

// State export for bug reports
const exported = store.exportState();
const bugReport = {
  state: exported,
  stepsToReproduce: ["1. Click button", "2. Fill form"],
  expected: "Form submits successfully",
  actual: "Error occurs",
};
```

## 🔄 Related Tasks

- **Depends on**: CORE-003, DEV-001
- **Blocks**: DEV-003
- **Related**: TEST-001 (Comprehensive testing)

## 🚨 Risk Assessment

| Risk                             | Probability | Impact | Mitigation                                  |
| -------------------------------- | ----------- | ------ | ------------------------------------------- |
| State import corruption          | Medium      | High   | Validation, checksums, backup before import |
| Mapping synchronization errors   | Medium      | Medium | Bidirectional mapping, periodic sync checks |
| Performance with large histories | High        | Medium | Lazy mapping, incremental cleanup           |
| DevTools protocol changes        | Low         | High   | Protocol versioning, feature detection      |

---

_Task ID: DEV-002_  
_Estimated Time: 12-14 hours_  
_Priority: 🔴 High_  
_Status: Not Started_  
_Assigned To: AI Developer_
