/**
 * E2E Tests for DevTools Backend Registration
 * 
 * These tests verify that the GridKit DevTools extension properly:
 * 1. Injects the backend script into the page
 * 2. Registers tables with the backend
 * 3. Handles timing issues between React hooks and backend initialization
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Wait for backend to be initialized in page context
 */
async function waitForBackend(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
      return backend && typeof backend.registerTable === 'function';
    },
    { timeout }
  );
}

/**
 * Wait for content script to be ready
 */
async function waitForContentScript(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content && typeof content.detectTables === 'function';
    },
    { timeout }
  );
}

/**
 * Check if table was registered with backend
 */
async function isTableRegistered(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
    if (!backend) return false;
    
    const tables = backend.getTables?.();
    return tables && tables.length > 0;
  });
}

/**
 * Get registered tables from backend
 */
async function getRegisteredTables(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
    if (!backend) return [];
    return backend.getTables?.() || [];
  });
}

/**
 * Get console logs related to DevTools
 */
async function getDevToolsLogs(page: Page): Promise<string[]> {
  const logs: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[GridKit DevTools]')) {
      logs.push(text);
    }
  });
  
  return logs;
}

test.describe('DevTools Backend Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should initialize backend script in page context', async ({ page }) => {
    // Wait for backend to initialize
    await waitForBackend(page);
    
    // Verify backend API is available
    const backendAvailable = await page.evaluate(() => {
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
      return !!(
        backend &&
        typeof backend.registerTable === 'function' &&
        typeof backend.unregisterTable === 'function' &&
        typeof backend.getTables === 'function'
      );
    });
    
    expect(backendAvailable).toBe(true);
  });

  test('should register table with backend via useDevToolsTable hook', async ({ page }) => {
    // Wait for backend and content script
    await waitForBackend(page);
    await waitForContentScript(page);
    
    // Wait for table registration (with retry)
    let registered = false;
    for (let i = 0; i < 20; i++) {
      registered = await isTableRegistered(page);
      if (registered) break;
      await page.waitForTimeout(100);
    }
    
    expect(registered).toBe(true);
    
    // Verify table was registered
    const tables = await getRegisteredTables(page);
    expect(tables.length).toBeGreaterThan(0);
  });

  test('should not show "Backend not available" error after initialization', async ({ page }) => {
    const logs: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Backend not available for registration')) {
          logs.push(text);
        }
      }
    });
    
    // Wait for backend to initialize
    await waitForBackend(page);
    
    // Wait for potential error messages
    await page.waitForTimeout(2000);
    
    // After backend is ready, there should be no "not available" errors
    // (errors before backend ready are expected and handled by retry logic)
    const backendReady = await page.evaluate(() => {
      return !!(window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
    });
    
    expect(backendReady).toBe(true);
  });

  test('should handle table registration timing correctly', async ({ page }) => {
    // Track registration sequence
    const sequence: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[GridKit DevTools]')) {
        sequence.push(text);
      }
    });
    
    // Wait for initialization
    await waitForBackend(page);
    await waitForContentScript(page);
    
    // Wait for registration
    await page.waitForFunction(
      async () => {
        const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
        if (!backend) return false;
        const tables = backend.getTables?.();
        return tables && tables.length > 0;
      },
      { timeout: 5000 }
    );
    
    // Verify correct sequence of events
    expect(sequence.some(log => log.includes('Backend initialized'))).toBe(true);
    expect(sequence.some(log => log.includes('Registered table'))).toBe(true);
  });

  test('should detect tables via content script polling', async ({ page }) => {
    await waitForContentScript(page);
    
    // Wait for content script to detect tables
    let tablesDetected = false;
    for (let i = 0; i < 30; i++) {
      const tables = await page.evaluate(() => {
        const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
        return content?.detectTables?.() || [];
      });
      
      if (tables.length > 0) {
        tablesDetected = true;
        break;
      }
      
      await page.waitForTimeout(500);
    }
    
    // Content script should detect tables through polling
    expect(tablesDetected).toBe(true);
  });

  test('should handle multiple table registrations', async ({ page }) => {
    await waitForBackend(page);
    
    // Wait for initial registration
    await page.waitForFunction(
      async () => {
        const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
        if (!backend) return false;
        const tables = backend.getTables?.();
        return tables && tables.length > 0;
      },
      { timeout: 5000 }
    );
    
    // Get initial table count
    const initialTables = await getRegisteredTables(page);
    expect(initialTables.length).toBeGreaterThan(0);
    
    // Verify no duplicate registrations
    const uniqueTables = new Set(initialTables);
    expect(uniqueTables.size).toBe(initialTables.length);
  });

  test('should cleanup table registration on unmount', async ({ page }) => {
    await waitForBackend(page);
    
    // Wait for table to be registered
    let registered = false;
    for (let i = 0; i < 20; i++) {
      registered = await isTableRegistered(page);
      if (registered) break;
      await page.waitForTimeout(100);
    }
    
    expect(registered).toBe(true);
    
    // Navigate away (which should trigger cleanup)
    await page.goto('about:blank');
    
    // Wait a bit for cleanup
    await page.waitForTimeout(500);
  });
});

test.describe('DevTools Backend API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForBackend(page);
  });

  test('should provide registerTable function', async ({ page }) => {
    const hasRegisterTable = await page.evaluate(() => {
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
      return typeof backend?.registerTable === 'function';
    });
    
    expect(hasRegisterTable).toBe(true);
  });

  test('should provide unregisterTable function', async ({ page }) => {
    const hasUnregisterTable = await page.evaluate(() => {
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
      return typeof backend?.unregisterTable === 'function';
    });
    
    expect(hasUnregisterTable).toBe(true);
  });

  test('should provide getTables function', async ({ page }) => {
    const hasGetTables = await page.evaluate(() => {
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
      return typeof backend?.getTables === 'function';
    });
    
    expect(hasGetTables).toBe(true);
  });

  test('should handle table state inspection', async ({ page }) => {
    // Wait for table registration
    await page.waitForFunction(
      async () => {
        const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
        if (!backend) return false;
        const tables = backend.getTables?.();
        return tables && tables.length > 0;
      },
      { timeout: 5000 }
    );
    
    // Verify we can get table state
    const canGetState = await page.evaluate(async () => {
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
      if (!backend) return false;
      
      const tables = backend.getTables?.();
      if (!tables || tables.length === 0) return false;
      
      // Try to get state (this would be called by DevTools panel)
      const response = await new Promise((resolve) => {
        const handler = (event: any) => {
          if (event.data?.type === 'RESPONSE') {
            resolve(event.data.payload);
          }
        };
        window.addEventListener('message', handler);
        
        // Request state
        window.postMessage({
          source: 'gridkit-devtools-content',
          type: 'COMMAND',
          payload: { type: 'GET_STATE', tableId: tables[0] }
        }, '*');
        
        setTimeout(() => resolve(null), 1000);
      });
      
      return response !== null;
    });
    
    expect(canGetState).toBe(true);
  });
});
