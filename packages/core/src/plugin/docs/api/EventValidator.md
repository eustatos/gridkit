# EventValidator

## Overview

`EventValidator` handles payload validation and sanitization for events to prevent security issues and malformed data. It ensures that events conform to expected formats and removes potentially dangerous content from event payloads.

## Features

- **Event Validation**: Validate event structure and required fields
- **Payload Sanitization**: Remove potentially dangerous properties
- **Metadata Sanitization**: Clean event metadata
- **Dangerous Property Detection**: Identify and remove prototype pollution vectors
- **Type Checking**: Verify event field types

## Installation

```typescript
import { EventValidator } from '@gridkit/plugin/security/EventValidator';
```

## Usage

### Creating an Event Validator

```typescript
import { EventValidator } from '@gridkit/plugin/security/EventValidator';

const validator = new EventValidator();

// Validate an event
const result = validator.validateEvent(event);
if (!result.isValid) {
  console.error(`Invalid event: ${result.errorMessage}`);
}

// Sanitize an event
const sanitized = validator.sanitizeEvent(event);
if (sanitized) {
  // Use sanitized event
  bus.emit(sanitized.type, sanitized.payload);
}
```

### Validating Events

```typescript
// Valid event
const validEvent = {
  type: 'user-login',
  payload: { userId: 123 },
  timestamp: Date.now(),
};

const result = validator.validateEvent(validEvent);
console.log(result.isValid); // true

// Invalid event (missing type)
const invalidEvent = {
  payload: { userId: 123 },
};

const invalidResult = validator.validateEvent(invalidEvent);
console.log(invalidResult.isValid); // false
console.log(invalidResult.errorMessage); // 'Event type is required'
```

### Sanitizing Events

```typescript
// Event with dangerous payload
const dangerousEvent = {
  type: 'user-data',
  payload: {
    userId: 123,
    __proto__: { dangerous: 'value' }, // Prototype pollution
    constructor: { dangerous: 'value' },
  },
};

const sanitized = validator.sanitizeEvent(dangerousEvent);

console.log(sanitized?.payload.__proto__); // undefined
console.log(sanitized?.payload.constructor); // undefined
```

## API

### Constructor

```typescript
new EventValidator()
```

Creates a new event validator instance.

### Interfaces

#### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  sanitizedPayload?: unknown;
}
```

### Methods

#### validateEvent()

```typescript
validateEvent(event: GridEvent): ValidationResult
```

Validates an event payload.

**Parameters**:

- `event` (GridEvent): The event to validate

**Returns**: `ValidationResult` - Validation result with validity flag and optional error message

**Example**:

```typescript
const result = validator.validateEvent(event);

if (!result.isValid) {
  console.error(`Validation failed: ${result.errorMessage}`);
  return;
}

// Event is valid, proceed with processing
```

#### sanitizeEvent()

```typescript
sanitizeEvent(event: GridEvent): GridEvent | null
```

Sanitizes an event payload to remove potentially harmful content.

**Parameters**:

- `event` (GridEvent): The event to sanitize

**Returns**: `GridEvent | null` - Sanitized event or null if event should be rejected

**Example**:

```typescript
const sanitized = validator.sanitizeEvent(event);

if (!sanitized) {
  console.warn('Event could not be sanitized');
  return;
}

// Use sanitized event
bus.emit(sanitized.type, sanitized.payload);
```

#### sanitizePayload()

```typescript
sanitizePayload(payload: unknown): unknown
```

Sanitizes event payload by removing dangerous properties.

**Parameters**:

- `payload` (unknown): The payload to sanitize

**Returns**: `unknown` - Sanitized payload

**Example**:

```typescript
const dangerousPayload = {
  userId: 123,
  __proto__: { dangerous: 'value' },
};

const safePayload = validator.sanitizePayload(dangerousPayload);

console.log(safePayload.__proto__); // undefined
```

#### sanitizeMetadata()

```typescript
sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown>
```

Sanitizes event metadata.

**Parameters**:

- `metadata` (Record<string, unknown>): The metadata to sanitize

**Returns**: `Record<string, unknown>` - Sanitized metadata

**Example**:

```typescript
const dangerousMetadata = {
  source: 'plugin-1',
  __proto__: { dangerous: 'value' },
};

const safeMetadata = validator.sanitizeMetadata(dangerousMetadata);

console.log(safeMetadata.__proto__); // undefined
```

## Dangerous Properties

The validator automatically removes the following dangerous properties:

- `__proto__` - Can be used for prototype pollution
- `constructor` - Can be used to access constructor functions
- `prototype` - Can be used for prototype manipulation

## Validation Rules

The validator checks the following:

1. **Event Type**: Must be present and be a string
2. **Event Source**: If present, must be a string
3. **Event Timestamp**: If present, must be a number
4. **Event Metadata**: If present, must be an object

## Best Practices

### 1. Always Validate and Sanitize

```typescript
// Good
const result = validator.validateEvent(event);
if (!result.isValid) {
  console.error(`Invalid event: ${result.errorMessage}`);
  return;
}

const sanitized = validator.sanitizeEvent(event);

// Bad
bus.emit(event.type, event.payload); // No validation!
```

### 2. Check Validation Results

```typescript
const result = validator.validateEvent(event);

if (!result.isValid) {
  // Handle validation failure
  logError(result.errorMessage);
  return;
}

// Process validated event
```

### 3. Sanitize Before Storage

```typescript
const sanitized = validator.sanitizeEvent(event);

if (sanitized) {
  // Store sanitized event
  database.save(sanitized);
}
```

### 4. Use Custom Validation

```typescript
// Extend validator for custom rules
class CustomValidator extends EventValidator {
  public validateCustomEvent(event: GridEvent): ValidationResult {
    const result = this.validateEvent(event);
    
    if (!result.isValid) {
      return result;
    }
    
    // Add custom validation logic
    if (event.type === 'user-login' && !event.payload?.userId) {
      return {
        isValid: false,
        errorMessage: 'user-login events must include userId',
      };
    }
    
    return result;
  }
}
```

## Examples

### Basic Event Validation

```typescript
import { EventValidator } from '@gridkit/plugin/security/EventValidator';

class SafeBus {
  private validator = new EventValidator();
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  public emit(type: string, payload: unknown, options?: EmitOptions): boolean {
    // Create event object
    const event = { type, payload, timestamp: Date.now() };
    
    // Validate
    const result = this.validator.validateEvent(event);
    if (!result.isValid) {
      console.error(`Event validation failed: ${result.errorMessage}`);
      return false;
    }
    
    // Sanitize
    const sanitized = this.validator.sanitizeEvent(event);
    if (!sanitized) {
      console.warn('Event could not be sanitized');
      return false;
    }
    
    // Emit sanitized event
    this.bus.emit(sanitized.type, sanitized.payload, options);
    return true;
  }
}
```

### Custom Schema Validation

```typescript
import { EventValidator } from '@gridkit/plugin/security/EventValidator';

interface UserEventSchema {
  type: 'user-login' | 'user-logout' | 'user-update';
  payload: {
    userId: number;
    timestamp: number;
    [key: string]: unknown;
  };
}

class SchemaValidator extends EventValidator {
  public validateUserEvent(event: GridEvent): ValidationResult {
    const result = this.validateEvent(event);
    if (!result.isValid) {
      return result;
    }
    
    const schema: UserEventSchema = event as UserEventSchema;
    
    // Validate event type
    if (!['user-login', 'user-logout', 'user-update'].includes(schema.type)) {
      return {
        isValid: false,
        errorMessage: 'Invalid user event type',
      };
    }
    
    // Validate payload structure
    if (typeof schema.payload?.userId !== 'number') {
      return {
        isValid: false,
        errorMessage: 'User event payload must include numeric userId',
      };
    }
    
    return {
      isValid: true,
    };
  }
}
```

### Integration with Event Bus

```typescript
import { EventValidator } from '@gridkit/plugin/security/EventValidator';

class SecureEventBus {
  private validator = new EventValidator();
  private events: GridEvent[] = [];

  public emit(type: string, payload: unknown): void {
    const event = {
      type,
      payload,
      timestamp: Date.now(),
      source: 'system',
    };

    // Validate and sanitize
    const result = this.validator.validateEvent(event);
    if (!result.isValid) {
      console.error(`Event rejected: ${result.errorMessage}`);
      return;
    }

    const sanitized = this.validator.sanitizeEvent(event);
    if (!sanitized) {
      console.warn('Event sanitized to null');
      return;
    }

    // Store and emit
    this.events.push(sanitized);
    // ... emit to handlers
  }

  public getHistory(): GridEvent[] {
    return this.events;
  }
}
```

## Related Documentation

- [EventSandbox](./EventSandbox.md) - Sandbox includes automatic sanitization
- [ErrorBoundary](./ErrorBoundary.md) - Handle validation errors
- [PluginSecurityGuide](../guides/PluginSecurityGuide.md) - Security best practices

## See Also

- [Event Isolation Security Guide](../guides/PluginSecurityGuide.md)
