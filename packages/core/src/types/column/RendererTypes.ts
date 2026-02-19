// RendererTypes.ts
// Renderer function types for header, cell, and footer
// This file is separate to avoid circular dependencies

import type { RowData } from '../base'

import type { HeaderContext, CellContext, FooterContext } from './RenderContext'

/**
 * Renderer function types.
 */
export type HeaderRenderer<TData extends RowData, TValue = unknown> = (
  context: HeaderContext<TData, TValue>
) => unknown;

export type CellRenderer<TData extends RowData, TValue = unknown> = (
  context: CellContext<TData, TValue>
) => unknown;

export type FooterRenderer<TData extends RowData, TValue = unknown> = (
  context: FooterContext<TData, TValue>
) => unknown;
