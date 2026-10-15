import React from 'react';
import { LoadingRows } from './LoadingRows';
import { EmptyState } from './EmptyState';
import { Pagination, PaginationProps } from './Pagination';
import { cn } from '../../utils/cn';

export type { PaginationProps };

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  align?: 'left' | 'center' | 'right';
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
    <div className={cn('data-table-container bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden', className)}>
      {/* Top Toolbar / Filter Area Header */}
      {toolbarHeader && (
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          {toolbarHeader}
        </div>
      )}

      {error ? (
        <div className="p-6 text-center text-xs font-semibold text-rose-600 bg-rose-50/50">
          {error}
        </div>
      ) : loading ? (
        <div className="p-6">
          <LoadingRows rows={5} />
        </div>
      ) : data.length > 0 ? (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase font-bold tracking-wider text-[11px]">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 select-none',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                        col.headerClassName
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {data.map((row) => {
                  const key = rowKey(row);
                  const isSelected = selectedRowKeys?.has(key);

                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'transition-colors duration-150',
                        onRowClick ? 'cursor-pointer hover:bg-surface-muted' : '',
                        isSelected ? 'bg-brand-pale/60' : 'bg-white'
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3.5 text-ink',
                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                            col.cellClassName
                          )}
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

          {/* Reusable Pagination */}
          {pagination && <Pagination {...pagination} />}
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
