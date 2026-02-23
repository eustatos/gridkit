// Plugin enhancer for TanStack Table adapter
// Uses GridKit core PluginManager for plugin management

import type { Table as TanStackTable, RowData } from '@tanstack/react-table'
import type { EnhancedTable, Plugin } from '../types/enhanced'
import { PluginManager } from '@gridkit/core/plugin'

/**
 * High-order function to add plugin management to TanStack Table
 */
export function withPlugins<TData extends RowData>(
  table: TanStackTable<TData>,
  plugins: Plugin[] = []
): EnhancedTable<TData> {
  // Create plugin manager from core
  const pluginManager = new PluginManager()

  // Register all plugins
  plugins.forEach(plugin => {
    pluginManager.register(plugin)
  })

  // Add plugin management methods
  const enhancedTable = {
    ...table,
    registerPlugin: (plugin: Plugin) => {
      pluginManager.register(plugin)
    },
    unregisterPlugin: (pluginId: string) => {
      pluginManager.unregister(pluginId)
    },
    getPlugin: (pluginId: string) => {
      return pluginManager.get(pluginId)
    },
    pluginManager,
  } as EnhancedTable<TData>

  return enhancedTable
}

/**
 * Create enhanced table with plugins from options
 */
export function createEnhancedTableWithPlugins<TData extends RowData>(
  options: any,
  plugins: Plugin[] = []
): EnhancedTable<TData> {
  // First create TanStack table
  const { useReactTable } = require('@tanstack/react-table')
  const tanstackTable = useReactTable(options)

  // Add plugins
  return withPlugins(tanstackTable, plugins)
}

/**
 * Enhanced version of TanStack useTable with plugins
 */
export function useTableWithPlugins<TData extends RowData>(
  options: any,
  plugins: Plugin[] = []
): EnhancedTable<TData> {
  const { useMemo } = require('react')
  const { useReactTable } = require('@tanstack/react-table')
  
  // First create TanStack table
  const tanstackTable = useReactTable(options)

  // Add plugins using useMemo for stability
  return useMemo(() => {
    return withPlugins(tanstackTable, plugins)
  }, [tanstackTable, plugins])
}
