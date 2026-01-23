// Тесты для Vue адаптера
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import * as vue from 'vue';

// Типы для моков
interface MockRef<T> {
  value: T;
}

type OnCleanup = (cleanupFn: () => void) => void;

// Мокаем vue для тестирования хука
jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  ref: jest.fn(),
  watchEffect: jest.fn(),
}));

describe('useAtom', () => {
  beforeEach(() => {
    // Сброс моков перед каждым тестом
    jest.clearAllMocks();
  });

  it('should return a ref with the initial value of the atom', () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Мокаем ref для контроля возвращаемого значения
    const refMock = jest.spyOn(vue, 'ref');
    refMock.mockImplementation(<T>(val: T): MockRef<T> => ({ value: val }));
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect');
    watchEffectMock.mockImplementation((fn) => {
      fn(jest.fn()); // onCleanup function
      return jest.fn(); // stop handler
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(42);
  });

  it('should update when the atom value changes', () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Мокаем ref для контроля возвращаемого значения
    let refValue: { value: number } = { value: 0 };
    const refMock = jest.spyOn(vue, 'ref');
    refMock.mockImplementation(<T>(val: T): MockRef<T> => {
      refValue = { value: val as unknown as number };
      return refValue as unknown as MockRef<T>;
    });
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect');
    watchEffectMock.mockImplementation((fn) => {
      fn(jest.fn()); // onCleanup function
      return jest.fn(); // stop handler
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(0);
    
    // Изменяем значение атома
    store.set(testAtom, 1);
    
    // Вызываем watchEffect вручную, так как мы замокали его
    const onCleanup = jest.fn();
    (watchEffectMock.mock.calls[0][0] as (onCleanup: OnCleanup) => void)(onCleanup);
    
    // Проверяем, что значение обновилось
    expect(result.value).toBe(1);
  });
});