---
epic_id: EPIC-002
module: @gridkit/features
owner: Core Team
status: 📋 Planning
priority: P1
story_points: 144
timeline: Week 4-6
---

# Epic: Core Features

## Executive Summary

Implement essential table features: sorting, filtering, pagination, selection, and virtualization. These are the core capabilities that make GridKit useful for real-world applications.

**Business Value:** Transforms the table from a static data display into an interactive, performant component capable of handling enterprise-scale datasets.

---

## Goals

- [ ] Client-side sorting (single and multi-column)
- [ ] Client-side filtering (text, number, date filters)
- [ ] Pagination (client and server-side)
- [ ] Row selection (single, multiple, range)
- [ ] Virtual scrolling for 100k+ rows
- [ ] REST data provider for server-side operations
- [ ] Performance: handle 10k rows efficiently

---

## Dependencies

**Depends on:**
- EPIC-001: Core Foundation (MUST be 100% complete)
- All type definitions stable and frozen
- Table factory working and tested
- Row model implementation complete

**Blocks:**
- EPIC-003: Advanced Features (grouping, advanced editing)
- Framework adapters (React, Vue)
- Production deployments

---

## User Stories

### Story 1: Client-Side Sorting

**Points:** 21  
**Dependencies:** EPIC-001 complete

**As a** user  
**I want** to sort table data by clicking column headers  
**So that** I can view data in my preferred order

**Acceptance Criteria:**
- [ ] Click column header to sort ascending
- [ ] Click again to sort descending  
- [ ] Click third time to clear sort
- [ ] Multi-column sorting with Shift+Click
- [ ] Visual indicators for sort direction (arrows/icons)
- [ ] Sort order numbers for multi-column (1, 2, 3...)
- [ ] Custom sort comparators supported
- [ ] Locale-aware string sorting (Intl.Collator)
- [ ] Null/undefined values handled (nulls last)
- [ ] Performance: sorts 10k rows in < 100ms

**Tasks:**
- SORT-001: Sorting state management (8h)
- SORT-002: Sort comparators - string, number, date (12h)
- SORT-003: Multi-column sorting logic (12h)
- SORT-004: Column API integration (8h)

---

### Story 2: Client-Side Filtering

**Points:** 34  
**Dependencies:** EPIC-001 complete

**As a** user  
**I want** to filter table data  
**So that** I can find specific records quickly

**Acceptance Criteria:**
- [ ] Text filters: contains, equals, starts with, ends with
- [ ] Number filters: equals, greater than, less than, between
- [ ] Date filters: before, after, between, relative dates
- [ ] Boolean filters: true/false/all
- [ ] Multiple filters combine with AND logic
- [ ] Clear individual filters
- [ ] Clear all filters at once
- [ ] Filter count indicator
- [ ] Performance: filters 10k rows in < 50ms

**Tasks:**
- FILTER-001: Filtering state management (8h)
- FILTER-002: Text filter predicates (8h)
- FILTER-003: Number filter predicates (8h)
- FILTER-004: Date filter predicates (12h)
- FILTER-005: Filter application logic (12h)
- FILTER-006: Column filter integration (8h)

---

### Story 3: Pagination

**Points:** 21  
**Dependencies:** EPIC-001 complete, FILTER-001

**As a** user  
**I want** paginated data  
**So that** I can navigate large datasets easily

**Acceptance Criteria:**
- [ ] Client-side pagination works
- [ ] Server-side pagination works
- [ ] Configurable page size (10, 25, 50, 100)
- [ ] Page navigation (first, previous, next, last)
- [ ] Jump to specific page number
- [ ] Total count and current range displayed
- [ ] Pagination persists through filtering/sorting
- [ ] Page resets to 1 when filters change

**Tasks:**
- PAGE-001: Pagination state (8h)
- PAGE-002: Client-side pagination logic (8h)
- PAGE-003: Server-side pagination integration (12h)
- PAGE-004: Pagination helpers and utilities (8h)

---

### Story 4: Row Selection

**Points:** 21  
**Dependencies:** EPIC-001 complete, ROW-001

**As a** user  
**I want** to select rows  
**So that** I can perform bulk actions on them

**Acceptance Criteria:**
- [ ] Single row selection (click)
- [ ] Multiple selection (Ctrl/Cmd + Click)
- [ ] Range selection (Shift + Click)
- [ ] Select all / deselect all
- [ ] Select all on current page only (option)
- [ ] Checkbox column (optional)
- [ ] Keyboard navigation (arrow keys)
- [ ] Enter/Space to select focused row
- [ ] Selection state persists through filtering/sorting

**Tasks:**
- SELECT-001: Selection state management (8h)
- SELECT-002: Single/multiple selection logic (8h)
- SELECT-003: Range selection logic (12h)
- SELECT-004: Keyboard navigation (16h)
- SELECT-005: Row selection API (8h)

---

### Story 5: Virtual Scrolling

**Points:** 34  
**Dependencies:** EPIC-001 complete, ROW-001

**As a** developer  
**I want** virtual scrolling  
**So that** I can display 100k+ rows without performance issues

**Acceptance Criteria:**
- [ ] Only visible rows rendered (+ overscan)
- [ ] Smooth scrolling experience (60fps)
- [ ] Handles 100k rows in < 200ms initial render
- [ ] Fixed row heights (variable heights = future)
- [ ] Scrollbar reflects total dataset height
- [ ] Keyboard navigation works with virtualization
- [ ] Scroll position maintained through updates
- [ ] Works with sorting/filtering/pagination

**Tasks:**
- VIRT-001: Virtual scroller core algorithm (16h)
- VIRT-002: Row recycling and rendering (16h)
- VIRT-003: Scroll position management (12h)
- VIRT-004: Table integration and testing (16h)

---

### Story 6: REST Data Provider

**Points:** 13  
**Dependencies:** EPIC-001 complete, DATA-001, SORT-001, FILTER-001, PAGE-001

**As a** developer  
**I want** REST API integration  
**So that** I can fetch data from a server with server-side operations

**Acceptance Criteria:**
- [ ] Fetch data from REST endpoint
- [ ] Send pagination params to server (page, pageSize)
- [ ] Send sorting params to server (column, direction)
- [ ] Send filtering params to server
- [ ] Handle loading states
- [ ] Handle errors gracefully with retry
- [ ] Request cancellation on rapid changes
- [ ] TypeScript types for API responses

**Tasks:**
- DATA-010: REST provider base implementation (12h)
- DATA-011: Query parameter serialization (8h)
- DATA-012: Response parsing and validation (8h)
- DATA-013: Error handling and retries (8h)

---

## Technical Approach

### Sorting
- **Algorithm:** Stable sort using Array.prototype.sort()
- **String comparison:** Intl.Collator for locale-aware sorting
- **Multi-column:** Sort by primary, then secondary, etc.
- **Memoization:** Cache sorted results until dependencies change
- **Null handling:** Configurable (nulls first/last)

### Filtering  
- **Pattern:** Predicate-based filtering
- **Composition:** Combine filters with AND logic
- **Performance:** Single pass through data
- **Future:** Indexed filtering for very large datasets

### Pagination
- **Client-side:** Slice array based on page and pageSize
- **Server-side:** Pass params to provider, display results
- **State sync:** Page resets when total changes

### Virtual Scrolling
- **Strategy:** Calculate visible range from scroll position
- **Row height:** Fixed initially (40px default)
- **Overscan:** Render 5 extra rows above/below viewport
- **Performance:** < 16ms per scroll frame (60fps)

### REST Provider
- **HTTP client:** Native fetch API
- **Serialization:** URLSearchParams for query strings
- **Cancellation:** AbortController for request cancellation
- **Retry:** Exponential backoff for failed requests

---

## Success Metrics

### Performance Benchmarks
- [ ] Sort 10k rows: < 100ms
- [ ] Filter 10k rows: < 50ms  
- [ ] Paginate: < 5ms
- [ ] Virtual scroll (100k rows): < 200ms initial, < 16ms per frame
- [ ] REST request: < 500ms (depends on server)

### Code Quality
- [ ] 100% test coverage for public APIs
- [ ] 90%+ coverage for internal logic
- [ ] All edge cases tested
- [ ] Performance benchmarks in CI
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings

### Developer Experience
- [ ] Type-safe APIs with generics
- [ ] Complete JSDoc for all exports
- [ ] 5+ working examples
- [ ] Clear error messages with context
- [ ] Migration guide from Phase 1

---

## Timeline

### Week 4: Sorting & Filtering Foundation
**Mon-Tue:** Sorting
- SORT-001, SORT-002 (AI Agent 1)
- FILTER-001, FILTER-002 (AI Agent 2)

**Wed-Fri:** Complete sorting and filtering
- SORT-003, SORT-004 (AI Agent 1)
- FILTER-003, FILTER-004, FILTER-005 (AI Agent 2)
- FILTER-006 (AI Agent 3)

### Week 5: Pagination & Selection
**Mon-Tue:** Pagination
- PAGE-001, PAGE-002, PAGE-003 (AI Agent 1)
- SELECT-001, SELECT-002 (AI Agent 2)

**Wed-Fri:** Selection complete
- PAGE-004 (AI Agent 1)
- SELECT-003, SELECT-004, SELECT-005 (AI Agent 2 + 3)

### Week 6: Virtualization & REST
**Mon-Wed:** Virtualization (complex!)
- VIRT-001, VIRT-002 (AI Agent 1 with human review)
- DATA-010, DATA-011 (AI Agent 2)

**Thu-Fri:** Integration & polish
- VIRT-003, VIRT-004 (AI Agent 1)
- DATA-012, DATA-013 (AI Agent 2)
- Integration testing (Human + AI)

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Virtualization complexity | High | Medium | Prototype early, reference react-virtual, thorough testing |
| Performance targets not met | High | Low | Continuous benchmarking, optimize hot paths, consider Web Workers |
| API design needs breaking changes | Medium | Medium | Review with architect before implementation, versioning strategy |
| REST provider assumes specific server format | Medium | High | Make serialization pluggable, document expected format |
| Selection state bugs with virtualization | Medium | Medium | Extensive edge case testing, use row IDs not indexes |

---

## Definition of Done

- [ ] All 6 user stories completed
- [ ] All 26 tasks completed and reviewed
- [ ] Performance benchmarks met and documented
- [ ] Tests pass with required coverage
- [ ] All public APIs documented with JSDoc
- [ ] 5+ examples created and working
- [ ] No critical or high-priority bugs
- [ ] Code reviewed and approved by architect
- [ ] Integration tests with Phase 1 passing
- [ ] Ready for framework adapter development

---

## Team Allocation

**Week 4-6:**
- 1 Senior Architect (40h/week) - Reviews, performance optimization
- 3 AI Agents (continuous) - Implementation
- 1 QA Engineer (40h/week) - Testing, edge cases, performance benchmarks

**Estimated Total:** 300-350 hours
**With parallelization:** 3 weeks

---

## Notes

- Virtual scrolling is the most complex feature - allocate extra time
- Performance testing should be continuous, not just at the end
- REST provider format should be documented clearly for users
- Consider pagination + virtualization interaction carefully
- Selection with virtualization needs special attention (use IDs, not indexes)

---

**Epic Owner:** Core Team  
**Created:** January 2024  
**Status:** Planning  
**Next Review:** End of Week 4