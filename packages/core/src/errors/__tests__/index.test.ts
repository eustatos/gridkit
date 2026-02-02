import { describe, it, expect } from 'vitest';
import { GridKitError, isGridKitError, assert, ErrorCode } from '../index';

describe('GridKitError', () => {
  describe('constructor', () => {
    it('should create error with code and message', () => {
      const error = new GridKitError('TABLE_NO_COLUMNS', 'At least one column is required');
      
      expect(error).toBeInstanceOf(GridKitError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('GridKitError');
      expect(error.code).toBe('TABLE_NO_COLUMNS');
      expect(error.message).toBe('At least one column is required');
      expect(error.context).toBeUndefined();
      expect(error.stack).toBeDefined();
    });
    
    it('should create error with context', () => {
      const context = { providedColumns: [], options: {} };
      const error = new GridKitError(
        'TABLE_INVALID_OPTIONS',
        'Invalid table options',
        context
      );
      
      expect(error.context).toEqual(context);
    });
  });
  
  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const context = { test: 'value' };
      const error = new GridKitError('TEST_ERROR', 'Test message', context);
      
      const json = error.toJSON();
      
      expect(json).toEqual({
        name: 'GridKitError',
        code: 'TEST_ERROR',
        message: 'Test message',
        context: { test: 'value' },
        stack: error.stack,
      });
    });
    
    it('should serialize error without context', () => {
      const error = new GridKitError('TEST_ERROR', 'Test message');
      
      const json = error.toJSON();
      
      expect(json.context).toBeUndefined();
    });
  });
  
  describe('fromUnknown', () => {
    it('should return GridKitError as-is', () => {
      const originalError = new GridKitError('ORIGINAL', 'Original message');
      const result = GridKitError.fromUnknown(originalError);
      
      expect(result).toBe(originalError);
    });
    
    it('should convert Error to GridKitError', () => {
      const originalError = new Error('Generic error');
      const result = GridKitError.fromUnknown(originalError, 'CONVERTED_ERROR');
      
      expect(result).toBeInstanceOf(GridKitError);
      expect(result.code).toBe('CONVERTED_ERROR');
      expect(result.message).toBe('Generic error');
      expect(result.context?.originalError).toBe(originalError);
    });
    
    it('should convert string to GridKitError', () => {
      const result = GridKitError.fromUnknown('String error', 'STRING_ERROR');
      
      expect(result).toBeInstanceOf(GridKitError);
      expect(result.code).toBe('STRING_ERROR');
      expect(result.message).toBe('String error');
      expect(result.context?.originalError).toBe('String error');
    });
    
    it('should convert number to GridKitError', () => {
      const result = GridKitError.fromUnknown(42, 'NUMBER_ERROR');
      
      expect(result).toBeInstanceOf(GridKitError);
      expect(result.code).toBe('NUMBER_ERROR');
      expect(result.message).toBe('42');
      expect(result.context?.originalError).toBe(42);
    });
    
    it('should convert null to GridKitError', () => {
      const result = GridKitError.fromUnknown(null, 'NULL_ERROR');
      
      expect(result).toBeInstanceOf(GridKitError);
      expect(result.code).toBe('NULL_ERROR');
      expect(result.message).toBe('null');
      expect(result.context?.originalError).toBe(null);
    });
  });
});

describe('isGridKitError', () => {
  it('should return true for GridKitError', () => {
    const error = new GridKitError('TEST', 'Test');
    expect(isGridKitError(error)).toBe(true);
  });
  
  it('should return false for generic Error', () => {
    const error = new Error('Generic');
    expect(isGridKitError(error)).toBe(false);
  });
  
  it('should return false for non-error values', () => {
    expect(isGridKitError('string')).toBe(false);
    expect(isGridKitError(42)).toBe(false);
    expect(isGridKitError(null)).toBe(false);
    expect(isGridKitError(undefined)).toBe(false);
    expect(isGridKitError({})).toBe(false);
  });
});

describe('assert', () => {
  it('should not throw when condition is true', () => {
    expect(() => {
      assert(true, 'TEST_ERROR', 'Should not throw');
    }).not.toThrow();
  });
  
  it('should throw GridKitError when condition is false', () => {
    expect(() => {
      assert(false, 'TEST_ERROR', 'Should throw');
    }).toThrow(GridKitError);
    
    expect(() => {
      assert(false, 'TEST_ERROR', 'Should throw');
    }).toThrow('Should throw');
  });
  
  it('should include context in thrown error', () => {
    const context = { value: 42 };
    
    try {
      assert(false, 'TEST_ERROR', 'Message', context);
      expect.fail('Should have thrown');
    } catch (error) {
      if (isGridKitError(error)) {
        expect(error.context).toEqual(context);
      } else {
        expect.fail('Should be GridKitError');
      }
    }
  });
  
  it('should work as type assertion', () => {
    const value: string | null = 'test';
    
    assert(value !== null, 'VALIDATION_FAILED', 'Value should not be null');
    
    // TypeScript should know value is string here
    const length = value.length;
    expect(length).toBe(4);
  });
});

describe('ErrorCode type', () => {
  it('should accept valid error codes', () => {
    // Type test - should compile without errors
    const codes: ErrorCode[] = [
      'TABLE_NO_COLUMNS',
      'COLUMN_INVALID_ACCESSOR',
      'ROW_NOT_FOUND',
      'STATE_UPDATE_FAILED',
      'PLUGIN_NOT_FOUND',
    ];
    
    expect(codes).toHaveLength(5);
  });
  
  it('should reject invalid error codes', () => {
    // @ts-expect-error - Invalid error code should not be accepted
    const invalidCode: ErrorCode = 'INVALID_CODE';
    
    // Runtime test
    expect(() => {
      // This would fail at runtime if type checking didn't catch it
      new GridKitError(invalidCode as ErrorCode, 'Test');
    }).not.toThrow();
  });
});
