---
task_id: [MODULE]-XXX
epic_id: EPIC-XXX
module: @gridkit/[module]
file: src/[path]/[filename].ts
priority: P0 | P1 | P2 | P3
complexity: low | medium | high
estimated_tokens: ~XX,000
assignable_to_ai: yes | with-review | no
dependencies:
  - [TASK-ID]
guidelines:
  - .github/AI_GUIDELINES.md
  - docs/patterns/[relevant-pattern].md
---

# Task: [Clear, Actionable Title]

## Context

[2-3 sentences explaining WHY this task exists and what problem it solves]

## Guidelines Reference

Before implementing, review:
- `.github/AI_GUIDELINES.md` - Code standards for AI
- `CONTRIBUTING.md` - General contributing rules  
- `src/[module]/` - Existing patterns in this module
- `docs/patterns/[pattern].md` - Relevant design pattern

## Objectives

- [ ] Specific objective 1
- [ ] Specific objective 2
- [ ] Specific objective 3

---

## Implementation Requirements

### 1. [Requirement Title]

**Expected interface:**
```typescript
/**
 * [Description]
 * @param [param] - [description]
 * @returns [description]
 * @example
 * ```typescript
 * // Usage example
 * ```
 */
export function functionName<TGeneric>(
  param: ParamType
): ReturnType;
```

**Implementation guidance:**
```typescript
// Provide skeleton or key algorithm steps
export function functionName<TGeneric>(
  param: ParamType
): ReturnType {
  // Step 1: Validate input
  // Step 2: Process data
  // Step 3: Return result
}
```

### 2. [Another Requirement]

[...]

---

## Test Requirements

Create `__tests__/[filename].test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionName } from '../[filename]';

describe('functionName', () => {
  describe('happy path', () => {
    it('should work with valid input', () => {
      const result = functionName(validInput);
      expect(result).toBe(expectedOutput);
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty input', () => {
      // Test implementation
    });
    
    it('should handle null/undefined', () => {
      // Test implementation
    });
  });
  
  describe('performance', () => {
    it('should process large dataset quickly', () => {
      // Performance test
    });
  });
});
```

---

## Edge Cases to Handle

- [ ] Null/undefined inputs
- [ ] Empty arrays/objects
- [ ] Invalid data types
- [ ] Boundary values (0, -1, MAX_INT)
- [ ] Circular references (if applicable)
- [ ] Large datasets (performance)

---

## Performance Requirements

- Function execution: < [X]ms for [Y] items
- Memory usage: < [X]MB for [Y] items
- No memory leaks
- Optimize hot paths (avoid allocations)

---

## Files to Create/Modify

- [ ] `src/[module]/[filename].ts` - Implementation
- [ ] `src/[module]/types.ts` - Types (if needed)
- [ ] `__tests__/[filename].test.ts` - Tests
- [ ] `src/[module]/index.ts` - Exports
- [ ] `docs/api/[module]/[function].md` - Documentation

---

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Performance benchmarks met
- [ ] Edge cases handled and documented
- [ ] JSDoc comments complete
- [ ] Follows patterns in AI_GUIDELINES.md

---

## Related Tasks

- **Depends on:** [TASK-IDs]
- **Blocks:** [TASK-IDs]
- **Related:** [TASK-IDs]

---

## Self-Check (Before marking complete)

Review `.github/AI_GUIDELINES.md` Section 9: Code Review Checklist

- [ ] TypeScript strict mode passes
- [ ] No `any` types used
- [ ] Explicit return types for public API
- [ ] Named exports only
- [ ] Tests generated alongside code
- [ ] No prohibited patterns
- [ ] Performance budgets respected
- [ ] Documentation updated

---

## Notes for AI

- Use existing utilities from `src/utils/` where possible
- Follow naming conventions from CONTRIBUTING.md
- Reuse patterns from similar implementations in the module
- If unsure about approach, provide multiple options with trade-offs
