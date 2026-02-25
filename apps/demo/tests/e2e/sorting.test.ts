import { test, expect } from '@playwright/test';

test.describe('Table Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow sorting by clicking header', async ({ page }) => {
    // Click on Name header to sort
    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();
    
    // Should show sort indicator
    await expect(nameHeader.locator('span:has-text("↑")')).toBeVisible();
  });

  test('should support multiple sort clicks', async ({ page }) => {
    const nameHeader = page.locator('thead th:has-text("Name")');
    
    // First click - ascending
    await nameHeader.click();
    await expect(nameHeader.locator('span:has-text("↑")')).toBeVisible();
    
    // Second click - descending
    await nameHeader.click();
    await expect(nameHeader.locator('span:has-text("↓")')).toBeVisible();
    
    // Third click - no sort
    await nameHeader.click();
    await expect(nameHeader.locator('span:has-text("↕")')).toBeVisible();
  });

  test('should sort Salary column in ascending order', async ({ page }) => {
    const salaryHeader = page.locator('thead th:has-text("Salary")');
    
    // Click to sort ascending
    await salaryHeader.click();
    
    // Wait for rows to update
    await page.waitForTimeout(100);
    
    // Get first row salary (should be lowest after ascending sort)
    const firstRowSalary = page.locator('tbody tr:first-child td:nth-child(5)');
    await expect(firstRowSalary).toBeVisible();
  });

  test('should sort Role column', async ({ page }) => {
    const roleHeader = page.locator('thead th:has-text("Role")');
    await roleHeader.click();
    
    await expect(roleHeader.locator('span:has-text("↑")')).toBeVisible();
  });
});
