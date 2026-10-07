import React from 'react';
import { LoadingRows } from './LoadingRows';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyCopy?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  toolbarHeader?: React.ReactNode;
  pagination?: PaginationProps;
  onRowClick?: (row: T) => void;
  selectedRowKeys?: Set<string>;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  error,
  emptyTitle = 'No data found',
  emptyCopy = 'No records match your criteria.',
  emptyIcon,
  emptyAction,
  toolbarHeader,
  pagination,
  onRowClick,
  selectedRowKeys,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`data-table-container bg-white border border-[#e4e9e3] rounded-xl shadow-2xs overflow-hidden ${className}`.trim()}>
      {/* Top Toolbar / Filter Area Header */}
      {toolbarHeader && (
        <div className="p-3.5 space-y-2.5 border-b border-[#edf0ec]">
          {toolbarHeader}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#fef2f2] border-b border-[#fecaca] text-xs font-semibold text-[#b91c1c]">
          {error}
        </div>
      )}

      {/* Content Area: Skeleton Loading, Table Rows, or Empty State */}
      {loading ? (
        <div className="p-4">
          <LoadingRows count={5} />
        </div>
      ) : data.length > 0 ? (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-left text-sm text-[#20322d] divide-y divide-[#edf0ec]">
              <thead className="bg-[#fafbf9] font-bold uppercase tracking-wider text-[#859189] text-xs">
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={`py-2.5 px-3.5 font-bold ${
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      } ${col.headerClassName || ''}`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ec]">
                {data.map(row => {
                  const key = rowKey(row);
                  const isSelected = selectedRowKeys?.has(key);

                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(row)}
                      className={`transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${isSelected ? 'bg-[#e9f3ee]/70' : 'hover:bg-[#f4f7f4]/80'}`}
                    >
                      {columns.map(col => (
                        <td
                          key={col.key}
                          className={`py-3 px-3.5 ${
                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                          } ${col.cellClassName || ''}`}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination && (
            <div className="p-4 bg-[#fafbf9] border-t border-[#edf0ec] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#73827b]">
              <div>
                Showing {pagination.totalItems ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0}–
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
                {pagination.totalItems} {pagination.itemLabel || 'items'}
              </div>

              <div className="flex items-center gap-4">
                {pagination.onPageSizeChange && (
                  <div className="flex items-center gap-2">
                    <span>Rows per page</span>
                    <select
                      className="h-8 px-2 bg-white border border-[#d8e0da] rounded-md text-xs font-semibold text-[#33483e] focus:outline-none cursor-pointer"
                      value={pagination.pageSize}
                      onChange={e => pagination.onPageSizeChange?.(Number(e.target.value))}
                    >
                      {(pagination.pageSizeOptions || [5, 10, 25]).map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pagination.currentPage <= 1}
                    className="w-8 h-8 rounded-md border border-[#d8e0da] bg-white flex items-center justify-center text-[#33483e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f6f3] transition-colors cursor-pointer"
                    onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                  >
                    ‹
                  </button>
                  <span className="w-8 h-8 rounded-md bg-[#1e6354] text-white font-bold flex items-center justify-center text-xs">
                    {pagination.currentPage}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="w-8 h-8 rounded-md border border-[#d8e0da] bg-white flex items-center justify-center text-[#33483e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f6f3] transition-colors cursor-pointer"
                    onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            copy={emptyCopy}
            action={emptyAction}
          />
        </div>
      )}
    </div>
  );
}
