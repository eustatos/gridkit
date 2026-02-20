import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table } from '../Table';
import { Column } from '../Column';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('Table', () => {
  it('should render table', () => {
    render(<Table data={testUsers} columns={testColumns} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  
  it('should render data', () => {
    render(<Table data={testUsers} columns={testColumns} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });
  
  it('should render column headers', () => {
    render(<Table data={testUsers} columns={testColumns} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
  
  it('should apply custom className to table', () => {
    render(<Table data={testUsers} columns={testColumns} className="custom-table" />);
    
    expect(screen.getByRole('table')).toHaveClass('custom-table');
  });
  
  it('should apply custom className to header', () => {
    render(<Table data={testUsers} columns={testColumns} headerClassName="custom-header" />);
    
    const thead = document.querySelector('thead');
    expect(thead).toHaveClass('custom-header');
  });
  
  it('should apply custom className to rows', () => {
    const { container } = render(<Table data={testUsers} columns={testColumns} rowClassName="custom-row" />);
    
    // Get all data rows (tbody > tr), excluding header row
    const tbody = container.querySelector('tbody');
    const rows = tbody?.querySelectorAll('tr') || [];
    
    expect(rows.length).toBe(5);
    rows.forEach((row) => {
      expect(row).toHaveClass('custom-row');
    });
  });
  
  it('should apply dynamic row className', () => {
    const rowClassName = (row: typeof testUsers[0]) => row.active ? 'active-row' : 'inactive-row';
    const { container } = render(<Table data={testUsers} columns={testColumns} rowClassName={rowClassName} />);
    
    // Get all data rows (tbody > tr), excluding header row
    const tbody = container.querySelector('tbody');
    const rows = tbody?.querySelectorAll('tr') || [];
    
    expect(rows.length).toBe(5);
    // First row (Alice) is active
    expect(rows[0]).toHaveClass('active-row');
    // Second row (Bob) is active
    expect(rows[1]).toHaveClass('active-row');
    // Third row (Charlie) is inactive
    expect(rows[2]).toHaveClass('inactive-row');
  });
  
  it('should apply custom className to cells', () => {
    const { container } = render(<Table data={testUsers} columns={testColumns} cellClassName="custom-cell" />);
    
    // Get all cells from tbody
    const tbody = container.querySelector('tbody');
    const cells = tbody?.querySelectorAll('td') || [];
    
    expect(cells.length).toBe(20); // 5 rows x 4 columns
    cells.forEach((cell) => {
      expect(cell).toHaveClass('custom-cell');
    });
  });
  
  it('should handle empty data', () => {
    const { container } = render(<Table data={[]} columns={testColumns} />);
    
    const tbody = container.querySelector('tbody');
    // tbody element exists but should be empty
    expect(tbody).toBeInTheDocument();
    expect(tbody?.querySelectorAll('tr')).toHaveLength(0);
  });
  
  it('should handle missing columns', () => {
    const { container } = render(<Table data={testUsers} columns={[]} />);
    
    // When there are no columns, thead is not rendered
    const thead = container.querySelector('thead');
    expect(thead).not.toBeInTheDocument();
  });
  
  it('should re-render when data changes', () => {
    const { rerender } = render(
      <Table data={testUsers} columns={testColumns} deps={[testUsers]} />
    );
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    
    const updatedUsers = [
      { ...testUsers[0], name: 'Alice Updated' },
      ...testUsers.slice(1),
    ];
    
    rerender(<Table data={updatedUsers} columns={testColumns} deps={updatedUsers} />);
    
    expect(screen.getByText('Alice Updated')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
  
  it('should handle column visibility', () => {
    const columns = [
      ...testColumns,
      {
        id: 'hidden',
        accessorKey: 'hiddenField',
        header: 'Hidden',
        enableHiding: true,
      },
    ];
    const data = [
      { ...testUsers[0], hiddenField: 'hidden' },
      ...testUsers.slice(1),
    ];
    
    render(<Table data={data} columns={columns} />);
    
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });
});

export {};

describe('Table with JSX columns', () => {
  it('should support Column JSX children', () => {
    const { container } = render(
      <Table data={testUsers}>
        <Column accessorKey="name" header="Name" />
        <Column accessorKey="email" header="Email" />
      </Table>
    );

    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelector('thead')).not.toBeNull();
    expect(container.querySelector('tbody')).not.toBeNull();
    
    // Check that headers are rendered
    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(2);
    expect(headers[0].textContent).toBe('Name');
    expect(headers[1].textContent).toBe('Email');
    
    // Check that data rows are rendered (count tbody rows only)
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    const dataRows = tbody?.querySelectorAll('tr');
    expect(dataRows).toHaveLength(5); // 5 data rows from testUsers
  });

  it('should support mixed props and JSX columns', () => {
    const { container } = render(
      <Table data={testUsers} className="custom-table">
        <Column accessorKey="name" header="Name" />
        <Column accessorKey="email" header="Email" />
      </Table>
    );

    expect(container.querySelector('table')?.className).toContain('custom-table');
  });

  it('should support complex cell renderers in JSX columns', () => {
    const { container } = render(
      <Table data={testUsers}>
        <Column accessorKey="name" header="Name" />
        <Column
          accessorKey="email"
          header="Email"
          cell={({ value }) => <a href={`mailto:${value}`}>{value}</a>}
        />
      </Table>
    );

    // Check that email links are rendered (5 users = 5 links)
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(5);
    expect(links[0].getAttribute('href')).toBe('mailto:alice@example.com');
    expect(links[1].getAttribute('href')).toBe('mailto:bob@example.com');
    expect(links[4].getAttribute('href')).toBe('mailto:eve@example.com');
  });

  it('should handle Column with enableSorting', () => {
    const { container } = render(
      <Table data={testUsers}>
        <Column accessorKey="name" header="Name" enableSorting />
        <Column accessorKey="email" header="Email" />
      </Table>
    );

    expect(container.querySelector('table')).not.toBeNull();
  });

  it('should handle nested Column in JSX structure', () => {
    const { container } = render(
      <Table data={testUsers}>
        <div>
          <Column accessorKey="name" header="Name" />
        </div>
        <Column accessorKey="email" header="Email" />
      </Table>
    );

    expect(container.querySelector('table')).not.toBeNull();
    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(2);
  });
});

  it('should render header with JSX columns', () => {
    const { container } = render(
      <Table data={testUsers}>
        <Column accessorKey="name" header="Name" />
        <Column accessorKey="email" header="Email" />
      </Table>
    );

    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(2);
    expect(headers[0].textContent).toBe('Name');
    expect(headers[1].textContent).toBe('Email');
  });

  it('should render data with JSX columns', () => {
    const { container } = render(
      <Table data={testUsers}>
        <Column accessorKey="name" header="Name" />
        <Column accessorKey="email" header="Email" />
      </Table>
    );

    // Find all tbody tr elements (data rows only)
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    
    const dataRows = tbody?.querySelectorAll('tr');
    expect(dataRows).toHaveLength(5); // 5 data rows from testUsers
    expect(container.querySelector('tbody')?.textContent).toContain('Alice');
    expect(container.querySelector('tbody')?.textContent).toContain('Bob');
    expect(container.querySelector('tbody')?.textContent).toContain('Charlie');
  });
