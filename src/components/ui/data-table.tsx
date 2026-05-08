'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Minus,
  Search,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  cellClassName?: string;
  headerClassName?: string;
  className?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Server-side pagination props
  serverPagination?: boolean;
  paginationMeta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  // Row expansion
  expandable?: boolean;
  renderExpandedRow?: (row: T) => React.ReactNode;
  // Column visibility
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
}

export function DataTable<T extends object>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data found',
  onSort,
  sortBy,
  sortOrder,
  serverPagination = false,
  paginationMeta,
  onPageChange,
  expandable = false,
  renderExpandedRow,
  columnVisibility,
  onColumnVisibilityChange,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  const visibility = columnVisibility ?? internalColumnVisibility;

  const responsiveColumns = React.useMemo(() => {
    return columns.filter((col) => visibility[col.key] !== false);
  }, [columns, visibility]);

  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // For client-side filtering and pagination
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((row) => {
      return columns.some((column) => {
        const value = (row as Record<string, unknown>)[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  const sortedData = React.useMemo(() => {
    if (!sortBy || !onSort) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortBy] as string | number;
      const bValue = (b as Record<string, unknown>)[sortBy] as string | number;

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortBy, sortOrder, onSort]);

  const paginatedData = React.useMemo(() => {
    if (serverPagination) return filteredData;

    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [filteredData, sortedData, currentPage, pageSize, pagination, serverPagination, data]);

  // Calculate pagination info
  const displayData = serverPagination ? filteredData : paginatedData;
  const totalItems = serverPagination ? paginationMeta?.total ?? sortedData.length : sortedData.length;
  const currentPageNum = serverPagination ? paginationMeta?.page ?? currentPage : currentPage;
  const totalPages = serverPagination ? paginationMeta?.totalPage ?? Math.ceil(sortedData.length / pageSize) : Math.ceil(sortedData.length / pageSize);
  const itemsPerPage = serverPagination ? paginationMeta?.limit ?? pageSize : pageSize;

  const showingFrom = totalItems > 0 ? (currentPageNum - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min(currentPageNum * itemsPerPage, totalItems);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;

    const newDirection =
      sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  const handlePageChange = (page: number) => {
    if (serverPagination && onPageChange) {
      onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when search changes (client-side only)
  React.useEffect(() => {
    if (!serverPagination) {
      setCurrentPage(1);
    }
  }, [searchTerm, serverPagination]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                {expandable && <TableHead className="w-[40px]"></TableHead>}
                {responsiveColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.sortable && 'cursor-pointer hover:bg-muted transition-colors select-none',
                      'font-semibold',
                      column.className,
                      column.headerClassName
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className={cn(
                      "flex items-center gap-2",
                      (column.headerClassName?.includes('text-right') || column.className?.includes('text-right')) && "justify-end"
                    )}>
                      {column.title}
                      {column.sortable && (
                        <span className={cn(
                          'text-muted-foreground transition-colors',
                          sortBy === column.key && 'text-foreground'
                        )}>
                          {sortBy === column.key ? (
                            sortOrder === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="opacity-30">↕</span>
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={responsiveColumns.length + (expandable ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <TableRow className="hover:bg-muted/50">
                      {expandable && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleRow(rowIndex)}
                          >
                            {expandedRows.has(rowIndex) ? (
                              <Minus className="h-4 w-4 text-primary" />
                            ) : (
                              <Plus className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      {responsiveColumns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(column.className, column.cellClassName)}
                        >
                          {column.render
                            ? column.render((row as Record<string, unknown>)[column.key], row)
                            : (row as Record<string, unknown>)[column.key] as React.ReactNode}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandable && expandedRows.has(rowIndex) && (
                      <TableRow className="border-b">
                        <TableCell colSpan={responsiveColumns.length + 1} className="p-0">
                          <div className="py-2">
                            {renderExpandedRow ? renderExpandedRow(row) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && (
        <div className="flex flex-wrap items-center justify-between px-2 gap-4">
          <div className="text-sm text-muted-foreground">
            {totalItems > 0 ? (
              <>
                Showing {showingFrom} to {showingTo} of {totalItems} {totalItems === 1 ? 'entry' : 'entries'}
              </>
            ) : (
              <>No entries found</>
            )}
          </div>
          {totalItems > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPageNum === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageNum - 1)}
                disabled={currentPageNum === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {totalPages > 0 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPageNum <= 3) {
                      pageNum = i + 1;
                    } else if (currentPageNum >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPageNum - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPageNum === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageNum + 1)}
                disabled={currentPageNum === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPageNum === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
