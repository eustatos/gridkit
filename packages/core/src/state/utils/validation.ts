import { GridKitError } from '../../errors/grid-kit-error';

/**
 * Validates store is not destroyed.
 */
export function validateNotDestroyed(isDestroyed: boolean): void {
  if (isDestroyed) {
    throw new GridKitError('STORE_DESTROYED', 'Cannot use store after destroy(). The store has been destroyed.', {
      timestamp: Date.now(),
    });
  }
}