// Тесты для React адаптера
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import { renderHook, act } from '@testing-library/react';

// Мокаем react для тестирования хука
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useMemo: jest.fn(),
}));

describe('useAtom', () => {
  beforeEach(() => {
    // Сброс моков перед каждым тестом
    jest.clearAllMocks();
  });

  it('should return the initial value of the atom', () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Мокаем useState и useMemo для контроля возвращаемых значений
    const useStateMock = jest.spyOn(require('react'), 'useState');
    useStateMock.mockImplementation((init) => [init, jest.fn()]);
    
    const useMemoMock = jest.spyOn(require('react'), 'useMemo');
    useMemoMock.mockImplementation(() => store);
    
    const useEffectMock = jest.spyOn(require('react'), 'useEffect');
    useEffectMock.mockImplementation((fn) => fn());
    
    const { result } = renderHook(() => useAtom(testAtom, store));
    
    expect(result.current).toBe(42);
  });

  it('should update when the atom value changes', () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Мокаем useState и useMemo для контроля возвращаемых значений
    const setState = jest.fn();
    const useStateMock = jest.spyOn(require('react'), 'useState');
    useStateMock.mockImplementation(() => [store.get(testAtom), setState]);
    
    const useMemoMock = jest.spyOn(require('react'), 'useMemo');
    useMemoMock.mockImplementation(() => store);
    
    const useEffectMock = jest.spyOn(require('react'), 'useEffect');
    useEffectMock.mockImplementation((fn) => fn());
    
    const { result } = renderHook(() => useAtom(testAtom, store));
    
    expect(result.current).toBe(0);
    
    // Изменяем значение атома
    act(() => {
      store.set(testAtom, 1);
    });
    
    // Проверяем, что значение обновилось
    // Поскольку мы мокаем useState, нам нужно вручную вызвать setState
    expect(setState).toHaveBeenCalledWith(1);
  });
});