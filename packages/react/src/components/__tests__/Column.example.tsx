/**
 * Example: Using JSX-based Column components
 * 
 * This demonstrates how to use the Column component for declarative
 * column definitions with JSX syntax.
 */

import React from 'react';
import { Table, Column } from '../Table';
import type { RowData } from '@gridkit/core';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
}

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 30, active: true },
  { id: '2', name: 'Bob', email: 'bob@example.com', age: 25, active: true },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', age: 35, active: false },
];

// Example 1: Basic JSX columns
export function BasicJSXColumnsExample() {
  return (
    <Table data={users}>
      <Column accessorKey="name" header="Name" />
      <Column accessorKey="email" header="Email" />
      <Column accessorKey="age" header="Age" />
    </Table>
  );
}

// Example 2: JSX columns with cell renderer
export function JSXColumnsWithCellRendererExample() {
  return (
    <Table data={users}>
      <Column accessorKey="name" header="Name" />
      <Column
        accessorKey="email"
        header="Email"
        cell={({ value }) => <a href={`mailto:${value}`}>{value}</a>}
      />
      <Column accessorKey="age" header="Age" />
    </Table>
  );
}

// Example 3: JSX columns with sorting enabled
export function JSXColumnsWithSortingExample() {
  return (
    <Table data={users}>
      <Column accessorKey="name" header="Name" enableSorting />
      <Column accessorKey="email" header="Email" enableSorting />
      <Column accessorKey="age" header="Age" enableSorting />
    </Table>
  );
}

// Example 4: Nested JSX structure (columns can be inside any wrapper)
export function NestedJSXExample() {
  return (
    <Table data={users}>
      <div>
        <Column accessorKey="name" header="Name" />
        <Column accessorKey="email" header="Email" />
      </div>
      <Column accessorKey="age" header="Age" />
    </Table>
  );
}

// Example 5: Mixed - JSX columns with props
export function MixedJSXAndPropsExample() {
  return (
    <Table data={users} className="my-table">
      <Column accessorKey="name" header="Name" />
      <Column accessorKey="email" header="Email" />
      <Column accessorKey="age" header="Age" />
    </Table>
  );
}

// Example 6: Using extractColumns manually
export function ExtractColumnsExample() {
  const columns = (
    <>
      <Column accessorKey="name" header="Name" />
      <Column accessorKey="email" header="Email" />
      <Column accessorKey="age" header="Age" />
    </>
  );
  
  // You can use extractColumns to get the column definitions
  // This is useful for more complex scenarios
  // const columnDefs = extractColumns<User>(columns);
  
  return (
    <Table data={users}>
      <Column accessorKey="name" header="Name" />
      <Column accessorKey="email" header="Email" />
      <Column accessorKey="age" header="Age" />
    </Table>
  );
}
