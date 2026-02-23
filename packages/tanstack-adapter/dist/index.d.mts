import { Table, RowData, TableOptions } from '@tanstack/react-table';

interface EventBus {
    on<T extends string>(event: T, handler: (event: any) => void): () => void;
    off<T extends string>(event: T, handler: (event: any) => void): void;
    emit<T extends string>(event: T, payload: any, options?: any): void;
    use(middleware: any): () => void;
}
interface PerformanceMonitor {
    getOperationStats(operation: string): any;
    getMemoryMetrics(): any;
}
interface ValidationManager {
    validateRow(row: any, index: number): Promise<any>;
    validateAll(rows?: any[]): Promise<any>;
}
interface Plugin {
    id: string;
    initialize(context: any): Promise<void>;
    destroy?(): Promise<void>;
}
interface EnhancedTable<TData> extends Table<TData> {
    on: EventBus['on'];
    off: EventBus['off'];
    emit: EventBus['emit'];
    use: EventBus['use'];
    metrics?: PerformanceMonitor;
    validator?: ValidationManager;
    validateRow?: (row: TData, index: number) => Promise<any>;
    validateAll?: () => Promise<any>;
    registerPlugin?: (plugin: Plugin) => void;
    unregisterPlugin?: (pluginId: string) => void;
    getPlugin?: (pluginId: string) => Plugin | undefined;
}
interface EnhancedTableFeatures {
    events?: EventConfig | boolean;
    performance?: PerformanceConfig | boolean;
    validation?: ValidationConfig | boolean;
    plugins?: Plugin[];
    debug?: DebugConfig | boolean;
}
interface EventConfig {
    middleware?: any[];
}
interface PerformanceConfig {
    budgets?: Record<string, number>;
    alerts?: {
        enabled: boolean;
        destinations?: string[];
    };
}
interface ValidationConfig {
    mode?: 'strict' | 'normal' | 'minimal' | 'none';
    autoFix?: boolean;
    cache?: boolean;
}
interface DebugConfig {
    events?: boolean;
    performance?: boolean;
    validation?: boolean;
    memory?: boolean;
    timeTravel?: boolean;
}

/**
 * Create enhanced table that combines TanStack Table with GridKit features
 */
declare function createEnhancedTable<TData>(tanstackTable: Table<TData>, _features?: EnhancedTableFeatures): EnhancedTable<TData>;
/**
 * Create enhanced table from scratch (without TanStack instance)
 */
declare function createEnhancedTableFromOptions<TData>(_options: any): EnhancedTable<TData>;
/**
 * Wrapper function to create enhanced table with default features
 */
declare function createDefaultEnhancedTable<TData>(options: any): EnhancedTable<TData>;

/**
 * High-order function to add event features to TanStack Table
 */
declare function withEvents<TData>(table: Table<TData>, _config?: EventConfig | boolean): EnhancedTable<TData>;

/**
 * High-order function to add performance monitoring to TanStack Table
 */
declare function withPerformanceMonitoring<TData>(table: Table<TData>, _config?: PerformanceConfig | boolean): EnhancedTable<TData>;

/**
 * High-order function to add validation to TanStack Table
 */
declare function withValidation<TData>(table: Table<TData>, config?: ValidationConfig): EnhancedTable<TData>;

/**
 * Enhanced useTable hook that adds GridKit features to TanStack Table
 */
declare function useGridEnhancedTable<TData extends RowData>(options: TableOptions<TData> & {
    features?: EnhancedTableFeatures;
}): EnhancedTable<TData>;
/**
 * Use table metrics hook for accessing performance metrics
 */
declare function useTableMetrics<TData extends RowData>(table: EnhancedTable<TData>): {
    getOperationStats: (operation: string) => any;
    getMemoryMetrics: () => any;
};
/**
 * Use validation hook for accessing validation methods
 */
declare function useValidation<TData extends RowData>(table: EnhancedTable<TData>): {
    validateRow: (row: TData, index: number) => Promise<any>;
    validateAll: () => Promise<any>;
    validator: ValidationManager | undefined;
};
/**
 * Use table events hook for accessing event methods
 */
declare function useTableEvents<TData extends RowData>(table: EnhancedTable<TData>): {
    on: <T extends string>(event: T, handler: (event: any) => void) => () => void;
    off: <T_1 extends string>(event: T_1, handler: (event: any) => void) => void;
    emit: <T_2 extends string>(event: T_2, payload: any, options?: any) => void;
    use: (middleware: any) => () => void;
};

export { type EnhancedTable, type EnhancedTableFeatures, createDefaultEnhancedTable, createEnhancedTable, createEnhancedTableFromOptions, useGridEnhancedTable, useTableEvents, useTableMetrics, useValidation, withEvents, withPerformanceMonitoring, withValidation };
