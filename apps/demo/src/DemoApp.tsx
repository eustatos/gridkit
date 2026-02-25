import React, { useMemo, useState } from 'react';
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
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            GridKit DevTools Demo
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-blue-700 text-white hover:bg-blue-600' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showNotifications 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              {showNotifications ? '🔔 Notifications: ON' : '🔇 Notifications: OFF'}
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-opacity-50 transition-colors"
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
              <tbody className={darkMode ? 'divide-gray-700' : 'divide-gray-200'}>
                {table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id} 
                    className={`
                      ${row.getIsSelected() 
                        ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-50') 
                        : (darkMode ? 'border-b border-gray-700' : 'border-b border-gray-100')
                      }
                    `}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
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
          <div className={`px-6 py-4 flex items-center justify-between ${
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
                className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} disabled:opacity-50`}
              >
                First
              </button>
              <button
                onClick={() => table.setPageIndex(pagination.pageIndex - 1)}
                disabled={pagination.pageIndex === 0}
                className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} disabled:opacity-50`}
              >
                Prev
              </button>
              <button
                onClick={() => table.setPageIndex(pagination.pageIndex + 1)}
                disabled={pagination.pageIndex >= table.getPageCount() - 1}
                className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} disabled:opacity-50`}
              >
                Next
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={pagination.pageIndex >= table.getPageCount() - 1}
                className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} disabled:opacity-50`}
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
