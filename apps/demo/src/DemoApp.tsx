import React, { useMemo, useState, useEffect } from 'react';
import { useEnhancedTable } from '@gridkit/tanstack-adapter';
import { useDevToolsTable } from '@gridkit/devtools';
import { flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, ColumnDef } from '@tanstack/react-table';

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  salary: number;
  joinDate: string;
}

const MOCK_DATA: Person[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `person-${i}`,
  name: `Person ${i + 1}`,
  email: `person${i + 1}@example.com`,
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'User' : 'Viewer',
  status: i % 2 === 0 ? 'active' : 'inactive',
  salary: 50000 + Math.random() * 100000,
  joinDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0]
}));

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => <div className="font-medium">{getValue<string>()}</div>
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }) => <div className="text-sm text-gray-500">{getValue<string>()}</div>
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => <div className="text-sm">{getValue<string>()}</div>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue<'active' | 'inactive'>();
      return (
        <span className={
          status === 'active'
            ? 'badge-success'
            : 'badge-danger'
        }>
          {status}
        </span>
      );
    }
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
  },
  {
    accessorKey: 'joinDate',
    header: 'Join Date',
    cell: ({ getValue }) => <div className="text-sm text-gray-600">{getValue<string>()}</div>
  }
];

export function DemoApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [prevSorting, setPrevSorting] = useState([]);
  const [prevPagination, setPrevPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useEnhancedTable<Person>({
    data: MOCK_DATA,
    columns,
    state: {
      sorting,
      pagination
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debug: true,
    features: {
      events: showNotifications,
      performance: true,
      validation: false,
      plugins: []
    }
  });

  // Register table with DevTools
  useDevToolsTable(table, true);

  // Send events to DevTools when table state changes
  useEffect(() => {
    if (JSON.stringify(sorting) !== JSON.stringify(prevSorting)) {
      // Send sorting event
      const backend = (window as unknown as Record<string, unknown>).__GRIDKIT_DEVTOOLS_BACKEND__ as
        | { send?: (msg: Record<string, unknown>) => void }
        | undefined;
      if (backend && typeof backend.send === 'function') {
        backend.send({
          type: 'EVENT_LOGGED',
          tableId: table.options.tableId || 'demo-table',
          payload: {
            event: {
              type: 'sorting',
              sorting: sorting,
              timestamp: Date.now()
            },
            timestamp: Date.now()
          }
        });
        console.log('[DemoApp] Sorting event sent to DevTools:', sorting);
      }
      setPrevSorting(sorting);
    }
  }, [sorting, prevSorting, table.options.tableId]);

  useEffect(() => {
    if (
      pagination.pageIndex !== prevPagination.pageIndex ||
      pagination.pageSize !== prevPagination.pageSize
    ) {
      // Send pagination event
      const backend = (window as unknown as Record<string, unknown>).__GRIDKIT_DEVTOOLS_BACKEND__ as
        | { send?: (msg: Record<string, unknown>) => void }
        | undefined;
      if (backend && typeof backend.send === 'function') {
        backend.send({
          type: 'EVENT_LOGGED',
          tableId: table.options.tableId || 'demo-table',
          payload: {
            event: {
              type: 'pagination',
              pagination: pagination,
              timestamp: Date.now()
            },
            timestamp: Date.now()
          }
        });
        console.log('[DemoApp] Pagination event sent to DevTools:', pagination);
      }
      setPrevPagination(pagination);
    }
  }, [pagination, prevPagination, table.options.tableId]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              GridKit DevTools Demo
            </h1>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Interactive table with DevTools integration
            </p>
          </div>
          
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`btn ${
                darkMode
                  ? 'bg-brand-700 text-white hover:bg-brand-600 focus:ring-brand-500'
                  : 'bg-brand-100 text-brand-700 hover:bg-brand-200 focus:ring-brand-500'
              }`}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`btn ${
                showNotifications
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500'
              }`}
            >
              {showNotifications ? '🔔 Notifications: ON' : '🔇 Notifications: OFF'}
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className={`card ${darkMode ? 'card-dark' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="table-header"
                      >
                        <div className="flex items-center gap-2">
                          <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && (
                            <span className={`text-xs ${
                              header.column.getIsSorted() === 'asc' ? 'text-green-500' :
                              header.column.getIsSorted() === 'desc' ? 'text-red-500' :
                              'text-gray-400'
                            }`}>
                              {header.column.getIsSorted() === 'asc' ? '↑' :
                               header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className={`
                      transition-colors duration-150
                      ${row.getIsSelected()
                        ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-50')
                        : (darkMode ? 'border-b border-gray-700 hover:bg-gray-700/50' : 'border-b border-gray-100 hover:bg-gray-50')
                      }
                    `}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="table-cell"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination & Statistics */}
          <div className={`px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-4">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Statistics:</strong> {table.getRowModel().rows.length} rows |
                {pagination.pageSize} per page |
                Page {pagination.pageIndex + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={pagination.pageIndex === 0}
                className={`btn-secondary ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : ''} disabled:opacity-50`}
              >
                First
              </button>
              <button
                onClick={() => table.setPageIndex(pagination.pageIndex - 1)}
                disabled={pagination.pageIndex === 0}
                className={`btn-secondary ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : ''} disabled:opacity-50`}
              >
                Prev
              </button>
              <button
                onClick={() => table.setPageIndex(pagination.pageIndex + 1)}
                disabled={pagination.pageIndex >= table.getPageCount() - 1}
                className={`btn-secondary ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : ''} disabled:opacity-50`}
              >
                Next
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={pagination.pageIndex >= table.getPageCount() - 1}
                className={`btn-secondary ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : ''} disabled:opacity-50`}
              >
                Last
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-indigo-200' : 'text-indigo-800'}`}>
            💡 Tips:
          </h3>
          <ul className={`space-y-1 text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
            <li>• Open Chrome DevTools Extension to see real-time table data</li>
            <li>• Try sorting, filtering, and pagination</li>
            <li>• Check the console for state changes</li>
            <li>• Toggle dark mode to test UI</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
