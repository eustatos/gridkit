// Тесты для Svelte адаптера
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import { readable } from 'svelte/store';

// Мокаем svelte/store для тестирования хука
jest.mock('svelte/store', () => ({
  ...jest.requireActual('svelte/store'),
  readable: jest.fn(),
}));

describe('useAtom', () => {
  beforeEach(() => {
    // Сброс моков перед каждым тестом
    jest.clearAllMocks();
  });

  it('should return a readable store with the initial value of the atom', () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Мокаем readable для контроля возвращаемого значения
    const readableMock = jest.spyOn(require('svelte/store'), 'readable');
    readableMock.mockImplementation((initial, start) => {
      let value = initial;
      const set = (newValue: any) => { value = newValue; };
      start(set);
      return { subscribe: (fn: any) => { fn(value); return () => {}; } };
    });
    
    const result = useAtom(testAtom, store);
    
    // Вызываем subscribe для проверки значения
    let receivedValue: any;
    result.subscribe((value: any) => { receivedValue = value; })();
    
    expect(receivedValue).toBe(42);
  });

  it('should update when the atom value changes', () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Мокаем readable для контроля возвращаемого значения
    const readableMock = jest.spyOn(require('svelte/store'), 'readable');
    readableMock.mockImplementation((initial, start) => {
      let value = initial;
      const set = (newValue: any) => { value = newValue; };
      start(set);
      return { subscribe: (fn: any) => { fn(value); return () => {}; } };
    });
    
    const result = useAtom(testAtom, store);
    
    // Проверяем начальное значение
    let receivedValue: any;
    const unsubscribe = result.subscribe((value: any) => { receivedValue = value; });
    expect(receivedValue).toBe(0);
    
    // Изменяем значение атома
    store.set(testAtom, 1);
    
    // Проверяем, что значение обновилось
    expect(receivedValue).toBe(1);
    
    // Отписываемся
    unsubscribe();
  });
});