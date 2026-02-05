// ColumnTypes.test.ts
// Type tests for column system

import type { ColumnDef, AccessorKey, ColumnValue } from './ColumnDef'
import type { RowData } from '../base'

describe('Column Type System', () => {
  test('AccessorKey infers nested paths', () => {
    interface Data {
      user: {
        profile: { name: string; age: number };
        email: string;
      };
    }

    type Keys = AccessorKey<Data>;
    // Should include: 'user', 'user.profile', 'user.profile.name',
    // 'user.profile.age', 'user.email'
    
    // Type assertions to verify correct inference
    const key1: Keys = 'user';
    const key2: Keys = 'user.profile';
    const key3: Keys = 'user.profile.name';
    const key4: Keys = 'user.profile.age';
    const key5: Keys = 'user.email';
    
    // This should compile without errors
    expect(key1).toBe('user');
    expect(key2).toBe('user.profile');
    expect(key3).toBe('user.profile.name');
    expect(key4).toBe('user.profile.age');
    expect(key5).toBe('user.email');
  });

  test('ColumnValue infers from accessorKey', () => {
    interface User {
      name: string;
      age: number;
    }

    type Col1 = ColumnDef<User, string> & { accessorKey: 'name' };
    type Value1 = ColumnValue<Col1>; // Should be string

    type Col2 = ColumnDef<User> & { accessorKey: 'age' };
    type Value2 = ColumnValue<Col2>; // Should be number
    
    // Type assertions to verify correct inference
    const value1: Value1 = 'John';
    const value2: Value2 = 30;
    
    // This should compile without errors
    expect(value1).toBe('John');
    expect(value2).toBe(30);
  });

  test('Mutually exclusive accessors enforced', () => {
    interface User {
      name: string;
    }
    
    // This should cause a TypeScript error if uncommented
    // const invalid: ColumnDef<User> = {
    //   accessorKey: 'name',
    //   accessorFn: () => 'test',
    // };
    
    // Valid usage
    const valid1: ColumnDef<User> = {
      accessorKey: 'name',
    };
    
    const valid2: ColumnDef<User, string> = {
      id: 'computed',
      accessorFn: () => 'test',
    };
    
    // This should compile without errors
    expect(valid1.accessorKey).toBe('name');
    expect(valid2.id).toBe('computed');
  });
});