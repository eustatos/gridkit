// Tests for React adapter
import { atom, createStore } from "@nexus-state/core";
import { useAtom } from "./index";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as React from "react";

// Types for mocks
type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type DependencyList = readonly unknown[] | undefined;

// Mock react for testing the hook
vi.mock("react", () => {
  const actualReact = vi.importActual("react") as typeof React;
  return {
    ...actualReact,
    useState: vi.fn(),
    useEffect: vi.fn(),
    useMemo: vi.fn(),
  };
});

describe("useAtom", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should return the initial value of the atom", () => {
    const store = createStore();
    const testAtom = atom(42);

    // Mock useState and useMemo to control return values
    const useStateMock = vi.spyOn(React, "useState") as vi.MockedFunction<
      <T>(initialState: T | (() => T)) => [T, Dispatch<SetStateAction<T>>]
    >;
    useStateMock.mockImplementation(<T>(initialState: T | (() => T)) => {
      const state =
        typeof initialState === "function"
          ? (initialState as () => T)()
          : initialState;
      return [state, vi.fn() as Dispatch<SetStateAction<T>>];
    });

    const useMemoMock = vi.spyOn(React, "useMemo") as vi.MockedFunction<
      <T>(factory: () => T, deps?: DependencyList) => T
    >;
    useMemoMock.mockImplementation(<T>(factory: () => T) => factory());

    const useEffectMock = vi.spyOn(React, "useEffect") as vi.MockedFunction<
      (effect: React.EffectCallback, deps?: DependencyList) => void
    >;
    useEffectMock.mockImplementation((fn) => {
      const cleanup = fn();
      if (cleanup && typeof cleanup === "function") {
        cleanup();
      }
    });

    const { result } = renderHook(() => useAtom(testAtom, store));

    expect(result.current).toBe(42);
  });

  it("should update when the atom value changes", () => {
    const store = createStore();
    const testAtom = atom(0);

    // Mock useState and useMemo to control return values
    const setState = vi.fn();
    const useStateMock = vi.spyOn(React, "useState") as vi.MockedFunction<
      <T>(initialState: T | (() => T)) => [T, Dispatch<SetStateAction<T>>]
    >;
    useStateMock.mockImplementation(<T>(initialState: T | (() => T)) => {
      const state =
        typeof initialState === "function"
          ? (initialState as () => T)()
          : initialState;
      return [state, setState as Dispatch<SetStateAction<T>>];
    });

    const useMemoMock = vi.spyOn(React, "useMemo") as vi.MockedFunction<
      <T>(factory: () => T, deps?: DependencyList) => T
    >;
    useMemoMock.mockImplementation(<T>(factory: () => T) => factory());

    const useEffectMock = vi.spyOn(React, "useEffect") as vi.MockedFunction<
      (effect: React.EffectCallback, deps?: DependencyList) => void
    >;
    useEffectMock.mockImplementation((fn) => {
      const cleanup = fn();
      if (cleanup && typeof cleanup === "function") {
        cleanup();
      }
    });

    const { result } = renderHook(() => useAtom(testAtom, store));

    expect(result.current).toBe(0);

    // Change the atom value
    act(() => {
      store.set(testAtom, 1);
    });

    // Check that the value was updated
    // Since we mock useState, we need to manually call setState
    expect(setState).toHaveBeenCalledWith(1);
  });
});
