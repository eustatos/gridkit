// Performance History Hook

import { useCallback, useReducer } from 'react';
import type { PerformanceMetrics, PerformanceHistory } from '../types/performance';
import { MAX_HISTORY_SIZE } from '../types/performance';

interface State {
  entries: PerformanceMetrics[];
}

type Action =
  | { type: 'ADD_METRIC'; payload: PerformanceMetrics }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_HISTORY'; payload: PerformanceMetrics[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_METRIC': {
      const newEntries = [...state.entries, action.payload].slice(-MAX_HISTORY_SIZE);
      return { entries: newEntries };
    }
    case 'CLEAR_HISTORY': {
      return { entries: [] };
    }
    case 'SET_HISTORY': {
      return { entries: action.payload.slice(-MAX_HISTORY_SIZE) };
    }
    default:
      return state;
  }
}

interface UsePerformanceHistoryReturn {
  history: PerformanceHistory;
  currentMetrics: PerformanceMetrics | null;
  previousMetrics: PerformanceMetrics | null;
  addMetric: (metric: PerformanceMetrics) => void;
  clearHistory: () => void;
  setHistory: (metrics: PerformanceMetrics[]) => void;
}

export function usePerformanceHistory(): UsePerformanceHistoryReturn {
  const [state, dispatch] = useReducer(reducer, { entries: [] });

  const addMetric = useCallback((metric: PerformanceMetrics) => {
    dispatch({ type: 'ADD_METRIC', payload: metric });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const setHistory = useCallback((metrics: PerformanceMetrics[]) => {
    dispatch({ type: 'SET_HISTORY', payload: metrics });
  }, []);

  const history: PerformanceHistory = {
    entries: state.entries,
    min: state.entries.length > 0
      ? Math.min(...state.entries.map((e) => e.lastRenderDuration ?? Infinity))
      : 0,
    max: state.entries.length > 0
      ? Math.max(...state.entries.map((e) => e.lastRenderDuration ?? 0))
      : 0,
    average: state.entries.length > 0
      ? state.entries.reduce((sum, e) => sum + (e.lastRenderDuration ?? 0), 0) / state.entries.length
      : 0,
  };

  const currentMetrics = state.entries[state.entries.length - 1] ?? null;

  const previousMetrics = state.entries.length > 1
    ? state.entries[state.entries.length - 2]
    : null;

  return {
    history,
    currentMetrics,
    previousMetrics,
    addMetric,
    clearHistory,
    setHistory,
  };
}
