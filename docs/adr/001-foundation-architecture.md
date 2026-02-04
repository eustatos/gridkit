# **ADR-001: Foundation Architecture for GridKit**

## **Context**

GridKit is being developed in phases, with Phase 01 (Foundation) being the critical first step. This phase establishes the core type system, state management, and table factory. The goal is to provide developers with a solid foundation for building applications with GridKit.

## **Decision**

We will implement the following architectural components for the Foundation phase:

1. **Core Type System**
   - Define comprehensive TypeScript interfaces and types for all GridKit components
   - Ensure full type safety for all APIs
   - Provide clear IntelliSense documentation with examples
   - Implement specific types including RowData, ColumnId, RowId, AccessorValue, RequireKeys, DeepPartial, Updater, Listener, Unsubscribe, Comparator, and Predicate
   - Ensure no `any` types are used
   - Make types extensible via generics
   - Add comprehensive JSDoc with examples

2. **Table Interfaces**
   - Define Table<TData> interface representing the main table instance with methods:
     - getState(): TableState<TData>
     - setState(updater: Updater<TableState<TData>>): void
     - subscribe(listener: Listener<TableState<TData>>): Unsubscribe
     - getAllColumns(): Column<TData>[]
     - getVisibleColumns(): Column<TData>[]
     - getColumn(id: ColumnId): Column<TData> | undefined
     - getRowModel(): RowModel<TData>
     - getRow(id: RowId): Row<TData> | undefined
     - reset(): void
     - destroy(): void
   - Define TableOptions<TData> interface for table configuration including columns, data, getRowId, initialState, debugMode, onStateChange, defaultColumn, and meta
   - Define TableState<TData> interface for internal state including data, columnVisibility, columnOrder, columnSizing, rowSelection, and expanded
   - Define TableMeta type for custom metadata

3. **State Management**
   - Implement immutable state patterns
   - Provide predictable state changes
   - Enable easy integration with React/Vue state management
   - Implement a lightweight, reactive state store with pub/sub pattern
   - Support both direct state and updater functions
   - Implement lifecycle methods (reset, destroy)
   - Implement Store<T> interface with methods getState(), setState(), subscribe(), reset(), and destroy()

4. **Table Factory**
   - Create a `createTable<TData>()` factory function
   - Provide sensible defaults for table configuration
   - Ensure a clean, discoverable API
   - Validate table options (columns required, etc.)
   - Initialize table state
   - Create column instances from definitions
   - Create row instances from data
   - Implement all Table interface methods
   - Add proper error handling with GridKitError
   - Support normalization of options with defaults
   - Subscribe to state changes to rebuild row model

## **Consequences**

- Developers will have a stable, type-safe foundation for building applications
- The core architecture will support future phases (Data Management, Column System, UI integration)
- Early adopters will be able to use the foundation APIs with confidence
- The implementation will not include UI rendering, data loading, or plugin systems (these are non-requirements for this phase)

## **References**

- [GridKit Product Requirements Document - Phase 01: Foundation](../prd/phase01-foundation.md)