import React, { useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  itemHeight?: number;
  loading?: boolean;
  loadingRows?: number;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  expandedRows?: Set<string>;
  getRowId?: (item: T) => string;
  renderExpandedContent?: (item: T) => React.ReactNode;
  expandedRowHeight?: number;
}

function VirtualizedTableRow({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: any;
}) {
  const { items, columns, onRowClick, expandedRows, getRowId, renderExpandedContent, expandedRowHeight = 200 } = data;
  const item = items[index];

  if (!item) {
    return (
      <div style={style} className="flex items-center space-x-4 px-4 border-b">
        {columns.map((_: any, colIndex: number) => (
          <Skeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    );
  }

  const isExpanded = expandedRows && getRowId ? expandedRows.has(getRowId(item)) : false;

  return (
    <div style={style}>
      {/* Main row */}
      <div 
        className="flex items-center space-x-4 px-4 border-b hover:bg-muted/50 cursor-pointer"
        onClick={() => onRowClick?.(item, index)}
        style={{ minHeight: '60px' }}
      >
        {columns.map((column: any, colIndex: number) => (
          <div 
            key={colIndex} 
            className={`flex-1 ${column.className || ''}`}
            style={{ width: column.width }}
          >
            {column.render 
              ? column.render(item, index)
              : String(item[column.key] || '')
            }
          </div>
        ))}
      </div>
      
      {/* Expanded content */}
      {isExpanded && renderExpandedContent && (
        <div className="bg-muted/20 border-b">
          {renderExpandedContent(item)}
        </div>
      )}
    </div>
  );
}

export function VirtualizedTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 60,
  loading = false,
  loadingRows = 10,
  onRowClick,
  className = '',
  expandedRows,
  getRowId,
  renderExpandedContent,
  expandedRowHeight = 200
}: VirtualizedTableProps<T>) {
  const listData = useMemo(() => ({
    items: loading ? Array(loadingRows).fill(null) as T[] : data,
    columns: columns as Column<T>[],
    onRowClick: onRowClick as ((item: T, index: number) => void) | undefined,
    expandedRows,
    getRowId,
    renderExpandedContent,
    expandedRowHeight
  }), [data, columns, onRowClick, loading, loadingRows, expandedRows, getRowId, renderExpandedContent, expandedRowHeight]);

  // For expandable rows, we'll use a fixed height that accommodates the largest possible row
  const effectiveItemHeight = (expandedRows && getRowId && renderExpandedContent) 
    ? itemHeight + expandedRowHeight 
    : itemHeight;

  return (
    <div className={`border border-border rounded-lg ${className}`}>
      {/* Table Header */}
      <div className="flex items-center space-x-4 px-4 py-3 bg-muted/50 border-b font-medium">
        {columns.map((column, index) => (
          <div 
            key={index} 
            className={`flex-1 ${column.className || ''}`}
            style={{ width: column.width }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <List
        height={height}
        width="100%"
        itemCount={loading ? loadingRows : data.length}
        itemSize={effectiveItemHeight}
        itemData={listData}
      >
        {VirtualizedTableRow}
      </List>
    </div>
  );
}

// Specialized virtualized table for infrastructure monitoring
export function VirtualizedInfrastructureTable({ 
  profiles, 
  loading = false,
  onProfileClick 
}: {
  profiles: any[];
  loading?: boolean;
  onProfileClick?: (profile: any) => void;
}) {
  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Profile Name',
      width: 200,
      render: (profile) => (
        <div>
          <div className="font-medium">{profile?.name}</div>
          <div className="text-xs text-muted-foreground">{profile?.id}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (profile) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          profile?.status === 'active' ? 'bg-secondary text-foreground' :
          profile?.status === 'banned' ? 'bg-muted text-muted-foreground' :
          'bg-muted text-muted-foreground'
        }`}>
          {profile?.status || 'Unknown'}
        </span>
      )
    },
    {
      key: 'proxy',
      header: 'Proxy',
      width: 150,
      render: (profile) => profile?.proxy || 'Not assigned'
    },
    {
      key: 'lastUsed',
      header: 'Last Used',
      width: 120,
      render: (profile) => profile?.lastUsed || 'Never'
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 100,
      render: () => (
        <button className="text-foreground hover:underline text-sm">
          View Details
        </button>
      )
    }
  ];

  return (
    <VirtualizedTable
      data={profiles}
      columns={columns}
      loading={loading}
      onRowClick={onProfileClick}
      height={500}
      itemHeight={70}
    />
  );
}

// Specialized virtualized table for billing transactions
export function VirtualizedTransactionsTable({ 
  transactions, 
  loading = false,
  onTransactionClick 
}: {
  transactions: any[];
  loading?: boolean;
  onTransactionClick?: (transaction: any) => void;
}) {
  const columns: Column<any>[] = [
    {
      key: 'id',
      header: 'Transaction ID',
      width: 150,
      render: (txn) => (
        <div className="font-mono text-sm">{txn?.id}</div>
      )
    },
    {
      key: 'client',
      header: 'Client',
      width: 150,
      render: (txn) => txn?.client || 'Unknown'
    },
    {
      key: 'type',
      header: 'Type',
      width: 100,
      render: (txn) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          txn?.type === 'top_up' ? 'bg-secondary text-foreground' :
          txn?.type === 'refund' ? 'bg-muted text-muted-foreground' :
          'bg-gray-100 text-gray-800'
        }`}>
          {txn?.type || 'Unknown'}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      width: 120,
      render: (txn) => (
        <div className="font-medium">
          ${txn?.amount?.toLocaleString() || '0'}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (txn) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          txn?.status === 'completed' ? 'bg-secondary text-foreground' :
          txn?.status === 'processing' ? 'bg-muted text-muted-foreground' :
          'bg-muted text-muted-foreground'
        }`}>
          {txn?.status || 'Unknown'}
        </span>
      )
    },
    {
      key: 'timestamp',
      header: 'Date',
      width: 120,
      render: (txn) => txn?.timestamp || 'Unknown'
    }
  ];

  return (
    <VirtualizedTable
      data={transactions}
      columns={columns}
      loading={loading}
      onRowClick={onTransactionClick}
      height={400}
      itemHeight={60}
    />
  );
} 