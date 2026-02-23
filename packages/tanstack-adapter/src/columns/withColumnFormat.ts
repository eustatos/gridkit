/**
 * Formatting Column Enhancer for TanStack Table
 *
 * Adds formatting and parsing capabilities to column definitions.
 * Includes common formatters for currency, percentage, date, and text.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

import type { ColumnDef } from '@tanstack/react-table'

/**
 * Formatter function type
 */
export type ColumnFormatter<TValue = unknown> = (value: TValue) => string

/**
 * Parser function type
 */
export type ColumnParser<TValue = unknown> = (input: string) => TValue

/**
 * Formatted column definition type
 */
export interface FormattedColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  format: ColumnFormatter<TValue>
  parse?: ColumnParser<TValue>
}

/**
 * Create a formatted column definition
 *
 * @param column - Base column definition
 * @param formatter - Format function
 * @param parser - Optional parse function
 * @returns Formatted column definition with formatting capabilities
 *
 * @example
 * ```typescript
 * const priceColumn = withColumnFormat(
 *   { accessorKey: 'price', header: 'Price' },
 *   (value) => `$${value.toFixed(2)}`
 * )
 * ```
 */
export function withColumnFormat<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  formatter: ColumnFormatter<TValue>,
  parser?: ColumnParser<TValue>
): ColumnDef<TData, TValue> {
  // Return as ColumnDef - the formatting is done in the cell renderer
  // We add format and parse as additional properties on the column definition
  return {
    ...column,
    format: formatter,
    parse: parser,
  } as ColumnDef<TData, TValue>
}

/**
 * Common formatters for different data types
 */
export const formatters = {
  /**
   * Currency formatter
   * @param decimals - Number of decimal places (default: 2)
   * @param currency - Currency symbol (default: $)
   */
  currency: (decimals = 2, currency = '$') => 
    (value: number) => `${currency}${value.toFixed(decimals)}`,

  /**
   * Percentage formatter
   * @param decimals - Number of decimal places (default: 1)
   * @param multiply - Multiply value by 100 (default: true)
   */
  percentage: (decimals = 1, multiply = true) => 
    (value: number) => {
      const computedValue = multiply ? value * 100 : value
      return `${computedValue.toFixed(decimals)}%`
    },

  /**
   * Date formatter
   * @param format - Format string (default: 'YYYY-MM-DD')
   * @example
   * formatters.date('MM/DD/YYYY')(new Date())
   */
  date: (format: 'ISO' | 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' = 'YYYY-MM-DD') => 
    (value: Date | string | number) => {
      const date = typeof value === 'string' || typeof value === 'number' 
        ? new Date(value) 
        : value
      
      if (isNaN(date.getTime())) {
        return ''
      }

      switch (format) {
        case 'ISO':
          return date.toISOString()
        case 'MM/DD/YYYY':
          return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
        case 'DD/MM/YYYY':
          return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
        case 'YYYY-MM-DD':
        default:
          return date.toISOString().split('T')[0]
      }
    },

  /**
   * Truncate text formatter
   * @param maxLength - Maximum length (default: 50)
   * @param suffix - Suffix for truncated text (default: '...')
   */
  truncate: (maxLength = 50, suffix = '...') => 
    (value: string) => 
      value.length > maxLength 
        ? `${value.slice(0, maxLength - suffix.length)}${suffix}` 
        : value,

  /**
   * Uppercase formatter
   */
  uppercase: () => (value: string) => value.toUpperCase(),

  /**
   * Lowercase formatter
   */
  lowercase: () => (value: string) => value.toLowerCase(),

  /**
   * Number formatter
   * @param decimals - Number of decimal places (default: 2)
   * @param useGrouping - Use thousand separators (default: true)
   */
  number: (decimals = 2, useGrouping = true) => 
    (value: number) => value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping,
    }),

  /**
   * File size formatter
   * @param decimals - Number of decimal places (default: 2)
   */
  fileSize: (decimals = 2) => 
    (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      const formatted = (bytes / Math.pow(k, i)).toFixed(decimals)
      // Remove trailing zeros after decimal point
      const clean = formatted.replace(/\.?0+$/, '')
      return clean + ' ' + sizes[i]
    },

  /**
   * Phone number formatter (US format)
   */
  phoneNumber: () => 
    (value: string) => {
      const digits = value.replace(/\D/g, '')
      
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
      }
      
      if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
      }
      
      return value
    },

  /**
   * Boolean formatter
   * @param trueText - Text for true values (default: 'Yes')
   * @param falseText - Text for false values (default: 'No')
   */
  boolean: (trueText = 'Yes', falseText = 'No') => 
    (value: boolean) => value ? trueText : falseText,

  /**
   * Capitalize formatter
   */
  capitalize: () => 
    (value: string) => 
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
}
