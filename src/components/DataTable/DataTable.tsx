import React from 'react';
import './DataTable.css';

// ── Types ────────────────────────────────────────────────────────────

export type ColumnType = 'text' | 'badge' | 'date' | 'actions';
export type ColumnAlign = 'left' | 'center' | 'right';

export interface TableColumn<T> {
  key: string;
  label: string;
  type?: ColumnType;
  align?: ColumnAlign;
  hideOnMobile?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableEmptyState {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export interface DataTableProps<T extends object> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (row: T) => string | number;
  gridTemplateColumns?: string;
  emptyState?: DataTableEmptyState;
  className?: string;
}

// ── Sub-component: TableHeader ───────────────────────────────────────

interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
}

function TableHeader<T>({ columns }: TableHeaderProps<T>) {
  return (
    <div className="dt-header-row" role="row">
      {columns.map((col) => {
        const isActions = col.type === 'actions';
        const align = col.align ?? (isActions ? 'right' : 'left');
        const classNames = [
          'dt-header-cell',
          `dt-align-${align}`,
          col.hideOnMobile ? 'dt-hide-mobile' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={col.key} className={classNames} role="columnheader">
            {col.label}
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-component: TableCell ─────────────────────────────────────────

interface TableCellProps<T extends object> {
  column: TableColumn<T>;
  row: T;
}

function TableCell<T extends object>({ column, row }: TableCellProps<T>) {
  const value = (row as Record<string, unknown>)[column.key];

  const defaultAlign: ColumnAlign =
    column.type === 'actions'
      ? 'right'
      : column.type === 'badge' || column.type === 'date'
      ? 'center'
      : 'left';

  const align = column.align ?? defaultAlign;

  const classNames = [
    'dt-cell',
    `dt-align-${align}`,
    column.type ? `dt-cell-${column.type}` : '',
    column.hideOnMobile ? 'dt-hide-mobile' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Custom renderer takes full control
  if (column.render) {
    return (
      <div className={classNames} role="cell">
        {column.render(value, row)}
      </div>
    );
  }

  // Built-in: date
  if (column.type === 'date') {
    return (
      <div className={classNames} role="cell">
        {value ? new Date(value as string).toLocaleDateString('pt-BR') : '—'}
      </div>
    );
  }

  // Built-in: badge
  if (column.type === 'badge') {
    const badgeValue = value ? String(value) : null;
    return (
      <div className={classNames} role="cell">
        {badgeValue ? (
          <span className={`dt-badge dt-badge--${badgeValue.toLowerCase()}`}>
            {badgeValue}
          </span>
        ) : (
          '—'
        )}
      </div>
    );
  }

  // Default: plain text
  return (
    <div className={classNames} role="cell">
      {value !== null && value !== undefined ? String(value) : '—'}
    </div>
  );
}

// ── Sub-component: TableRow ──────────────────────────────────────────

interface TableRowProps<T extends object> {
  row: T;
  columns: TableColumn<T>[];
}

function TableRow<T extends object>({ row, columns }: TableRowProps<T>) {
  return (
    <div className="dt-row" role="row">
      {columns.map((col) => (
        <TableCell key={col.key} column={col} row={row} />
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function DataTable<T extends object>({
  data,
  columns,
  keyExtractor,
  gridTemplateColumns,
  emptyState,
  className = '',
}: DataTableProps<T>) {
  const gridStyle = {
    '--dt-grid':
      gridTemplateColumns ??
      `repeat(${columns.length}, minmax(80px, 1fr))`,
  } as React.CSSProperties;

  if (data.length === 0 && emptyState) {
    return (
      <div className={`dt-empty ${className}`}>
        {emptyState.icon && (
          <div className="dt-empty-icon">{emptyState.icon}</div>
        )}
        <h3 className="dt-empty-title">{emptyState.title}</h3>
        {emptyState.description && (
          <p className="dt-empty-description">{emptyState.description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`dt-container ${className}`}
      style={gridStyle}
      role="table"
      aria-rowcount={data.length}
    >
      <TableHeader columns={columns} />
      <div className="dt-body" role="rowgroup">
        {data.map((row) => {
          const rowKey = keyExtractor(row);
          return <TableRow key={rowKey} row={row} columns={columns} />;
        })}
      </div>
    </div>
  );
}
