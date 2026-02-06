# Phase 1: Core Refactoring

## 🎯 Phase Objectives

Refactor the core architecture to fix inconsistencies, simplify time travel implementation, and establish a solid foundation for DevTools integration while maintaining backward compatibility.

## 📅 Timeline

**Start Date:** Immediate  
**Duration:** 1-2 weeks  
**Priority:** 🔴 High (Blocks all other phases)

## 🚨 Problem Statement

The current implementation has several architectural inconsistencies:

1. **Atom Registry** is disconnected from the Store
2. **TypeScript interfaces** don't match implementations
3. **Time Travel** is overly complex and not integrated
4. **DevTools Plugin** lacks proper integration points

## 🏗️ Architectural Changes

### 1. Atom Registry Integration

**Current Issue:** Global registry doesn't know about Store instances  
**Solution:** Make registry store-aware with per-store isolation option

### 2. Type Consistency

**Current Issue:** `Atom` interface doesn't reflect actual usage  
**Solution:** Unified `Atom<Value>` type with explicit `read`/`write` methods

### 3. Time Travel Simplification

**Current Issue:** Three separate classes with complex interactions  
**Solution:** Single `TimeTravel` class integrated into `EnhancedStore`

### 4. Store Enhancement

**Current Issue:** DevTools integration requires manual setup  
**Solution:** Built-in plugin system in `createEnhancedStore`

## 📋 Required Tasks

### Priority Order:

1. **CORE-001**: Fix Atom Registry Store Integration
   - Make registry store-aware
   - Add per-store isolation option
   - Maintain global fallback for compatibility

2. **CORE-002**: Update TypeScript Interfaces
   - Align interfaces with actual implementations
   - Add proper generics for computed atoms
   - Export all public types

3. **CORE-003**: Implement Simple Time Travel Core
   - Replace three-class system with single class
   - Integrate with EnhancedStore
   - Basic undo/redo functionality

## 🔧 Technical Approach

### Strategy: Incremental Refactoring

1. **Step 1**: Fix types without breaking existing code
2. **Step 2**: Add new APIs alongside old ones
3. **Step 3**: Migrate internal usage to new APIs
4. **Step 4**: Deprecate old APIs (optional for now)

### Compatibility Guarantee:

- All existing code will continue to work
- New features are opt-in via `createEnhancedStore`
- No breaking changes to public API

## 🧪 Testing Strategy

### Unit Tests:

- 100% coverage for new code
- 90%+ coverage for modified code
- Mock external dependencies

### Integration Tests:

- Store + Registry integration
- Time travel with computed atoms
- Backward compatibility verification

### Performance Tests:

- Memory usage with 1000 atoms
- Snapshot creation/restoration speed
- No regression in existing benchmarks

## 📊 Success Metrics

### Must Have (Phase Completion):

- [ ] All existing tests pass
- [ ] Bundle size < 5KB (core)
- [ ] Time travel works for primitive atoms
- [ ] No breaking changes to public API

### Should Have (Quality):

- [ ] 95%+ test coverage for new code
- [ ] Performance: < 50ms for 100 atom restore
- [ ] Memory: < 10MB for 100 snapshots

### Nice to Have (Extra):

- [ ] DevTools plugin works with new architecture
- [ ] Computed atom time travel support
- [ ] Automated migration examples

## 🚦 Exit Criteria

Phase is complete when:

1. All three tasks are implemented and tested
2. Success metrics are met
3. Phase 2 (DevTools) can begin without blockers
4. Documentation is updated for new APIs

## 🔗 Dependencies

- **Internal**: None (this is the foundation)
- **External**: TypeScript 4.9+, Node.js 16+
- **Tools**: Existing test infrastructure

## 📝 Documentation Updates Required

1. Update `README.md` with new APIs
2. Add migration guide for advanced users
3. Update TypeDoc comments
4. Create examples for new features

## 🚨 Risks and Mitigation

### Risk 1: Breaking Changes

**Impact:** High  
**Probability:** Low  
**Mitigation:** Extensive testing, feature flags, gradual rollout

### Risk 2: Performance Regression

**Impact:** Medium  
**Probability:** Medium  
**Mitigation:** Benchmark tests, performance monitoring

### Risk 3: Scope Creep

**Impact:** High  
**Probability:** Medium  
**Mitigation:** Strict task boundaries, no "while we're at it" changes

## 👥 Stakeholders

- **Primary**: Core library users
- **Secondary**: Plugin developers
- **Tertiary**: Framework adapter maintainers

## 📈 Progress Tracking

| Task     | Status      | Started | Completed | Notes           |
| -------- | ----------- | ------- | --------- | --------------- |
| CORE-001 | Not Started | -       | -         | High priority   |
| CORE-002 | Not Started | -       | -         | Medium priority |
| CORE-003 | Not Started | -       | -         | High priority   |

---

_Phase Lead: AI/Developer_  
_Approval Required: Self-review + automated tests_  
_Next Phase: 02-devtools-integration_
