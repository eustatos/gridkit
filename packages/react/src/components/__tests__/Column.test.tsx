import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { RowData } from '@gridkit/core';
import { Column, extractColumns, hasColumnChildren } from '../Column';

// Test data types
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  active: boolean;
}

// Test data
const testUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, active: true },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, active: false },
];

describe('Column Component', () => {
  describe('Column component', () => {
    it('should render nothing', () => {
      const { container } = render(
        <Column accessorKey="name" header="Name" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should have correct displayName', () => {
      expect(Column.displayName).toBe('Column');
    });

    it('should support all column props', () => {
      const { container } = render(
        <Column
          id="custom-id"
          accessorKey="name"
          header="Name"
          cell={({ value }) => <span>{value}</span>}
          footer="Footer"
          enableSorting
          enableFiltering
          width={200}
          minWidth={100}
          maxWidth={300}
          enableResizing
          enableHiding
          enableReordering
          enablePinning
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should work with JSX children', () => {
      const wrapper = ({ children }: { children?: React.ReactNode }) => (
        <div>{children}</div>
      );

      const { container } = render(
        <wrapper>
          <Column accessorKey="name" header="Name" />
        </wrapper>
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('extractColumns', () => {
    it('should extract column definitions from Column components', () => {
      const columns = extractColumns<User>(
        <>
          <Column accessorKey="name" header="Name" />
          <Column accessorKey="email" header="Email" />
        </>
      );

      expect(columns).toHaveLength(2);
      expect(columns[0].accessorKey).toBe('name');
      expect(columns[0].header).toBe('Name');
      expect(columns[1].accessorKey).toBe('email');
      expect(columns[1].header).toBe('Email');
    });

    it('should use accessorKey as id when id is not provided (for core compatibility)', () => {
      const columns = extractColumns<User>(
        <Column accessorKey="name" header="Name" />
      );

      // For better compatibility with core types, use accessorKey as default id
      expect(columns[0].id).toBe('name');
    });

    it('should use provided id when available', () => {
      const columns = extractColumns<User>(
        <Column id="customName" accessorKey="name" header="Name" />
      );

      expect(columns[0].id).toBe('customName');
    });

    it('should extract all column properties', () => {
      const columns = extractColumns<User>(
        <Column
          id="name"
          accessorKey="name"
          header="Name"
          cell={({ value }) => <span>{value}</span>}
          footer="Footer"
          enableSorting={true}
          enableFiltering={false}
          width={200}
          minWidth={100}
          maxWidth={300}
          enableResizing={true}
          enableHiding={false}
          enableReordering={true}
          enablePinning={false}
        />
      );

      expect(columns[0]).toMatchObject({
        id: 'name',
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableFiltering: false,
        size: 200,
        minSize: 100,
        maxSize: 300,
        enableResizing: true,
        enableHiding: false,
        enableReordering: true,
        enablePinning: false,
      });
    });

    it('should handle cell renderer', () => {
      const cellFn = ({ value }: { value: string }) => <span>{value}</span>;
      
      const columns = extractColumns<User>(
        <Column accessorKey="name" header="Name" cell={cellFn} />
      );

      expect(typeof columns[0].cell).toBe('function');
    });

    it('should extract multiple columns', () => {
      const columns = extractColumns<User>(
        <>
          <Column accessorKey="id" header="ID" />
          <Column accessorKey="name" header="Name" />
          <Column accessorKey="email" header="Email" />
          <Column accessorKey="age" header="Age" />
        </>
      );

      expect(columns).toHaveLength(4);
      expect(columns.map((c) => c.accessorKey)).toEqual([
        'id',
        'name',
        'email',
        'age',
      ]);
    });

    it('should ignore non-Column children', () => {
      const columns = extractColumns<User>(
        <>
          <div>Not a column</div>
          <Column accessorKey="name" header="Name" />
          <span>Also not a column</span>
        </>
      );

      expect(columns).toHaveLength(1);
      expect(columns[0].accessorKey).toBe('name');
    });

    it('should handle empty children', () => {
      const columns = extractColumns<User>(null);

      expect(columns).toHaveLength(0);
    });

    it('should handle undefined children', () => {
      const columns = extractColumns<User>(undefined);

      expect(columns).toHaveLength(0);
    });

    it('should handle complex cell renderers', () => {
      const cellFn = ({ value, row }: { value: number; row: User }) => (
        <strong>{value}</strong>
      );

      const columns = extractColumns<User>(
        <Column accessorKey="age" header="Age" cell={cellFn} />
      );

      expect(typeof columns[0].cell).toBe('function');
      
      // The cell is wrapped to accept CellContext, so we need to test it that way
      // Create a mock CellContext
      const mockContext = {
        getValue: () => 30,
        getRow: () => testUsers[0],
        column: {},
        table: {},
        rowIndex: 0,
        cellIndex: 0,
        getIsSelected: () => false,
        renderValue: () => 30,
        meta: {},
      };
      
      const result = columns[0].cell?.(mockContext);
      expect(result).toBeDefined();
      // The wrapped cell returns ReactNode, so we can check if it's an element
      expect(React.isValidElement(result)).toBe(true);
    });

    it('should handle nested JSX structures', () => {
      const columns = extractColumns<User>(
        <div>
          <div>
            <Column accessorKey="name" header="Name" />
          </div>
        </div>
      );

      expect(columns).toHaveLength(1);
      expect(columns[0].accessorKey).toBe('name');
    });
  });

  describe('hasColumnChildren', () => {
    it('should return true for Column components', () => {
      const hasColumns = hasColumnChildren(
        <Column accessorKey="name" header="Name" />
      );
      expect(hasColumns).toBe(true);
    });

    it('should return false for non-Column components', () => {
      const hasColumns = hasColumnChildren(
        <div>Not a column</div>
      );
      expect(hasColumns).toBe(false);
    });

    it('should return true for mixed children with columns', () => {
      const hasColumns = hasColumnChildren(
        <>
          <div>Something</div>
          <Column accessorKey="name" header="Name" />
        </>
      );
      expect(hasColumns).toBe(true);
    });

    it('should return false for empty children', () => {
      const hasColumns = hasColumnChildren(null);
      expect(hasColumns).toBe(false);
    });

    it('should return false for undefined children', () => {
      const hasColumns = hasColumnChildren(undefined);
      expect(hasColumns).toBe(false);
    });

    it('should return true for nested column', () => {
      const hasColumns = hasColumnChildren(
        <div>
          <Column accessorKey="name" header="Name" />
        </div>
      );
      expect(hasColumns).toBe(true);
    });
  });
});
