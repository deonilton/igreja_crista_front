import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { Member } from '../../../types';
import DataTable, { type TableColumn, type DataTableEmptyState } from '../../../components/DataTable';

export interface MembersTableProps {
  members: Member[];
  canManageMembers: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  formatPhone: (phone: string | null) => string;
  emptyState?: DataTableEmptyState;
}

export default function MembersTable({
  members,
  canManageMembers,
  onEdit,
  onDelete,
  formatPhone,
  emptyState,
}: MembersTableProps) {
  const baseColumns: TableColumn<Member>[] = [
    {
      key: 'full_name',
      label: 'Nome',
      render: (_, row) => (
        <>
          <div className="dt-primary">{row.full_name}</div>
          {row.email && <div className="dt-secondary">{row.email}</div>}
        </>
      ),
    },
    {
      key: 'phone',
      label: 'Telefone',
      hideOnMobile: true,
      render: (_, row) => formatPhone(row.phone),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      align: 'center',
    },
    {
      key: 'created_at',
      label: 'Data de Cadastro',
      type: 'date',
      align: 'center',
      hideOnMobile: true,
    },
  ];

  const actionsColumn: TableColumn<Member> = {
    key: 'actions',
    label: 'Ações',
    type: 'actions',
    align: 'right',
    render: (_, row) => (
      <div className="dt-actions">
        <button
          className="dt-btn-icon"
          title="Editar"
          onClick={() => onEdit(row.id)}
          aria-label={`Editar ${row.full_name}`}
        >
          <FiEdit2 />
        </button>
        <button
          className="dt-btn-icon dt-btn-icon--danger"
          title="Excluir"
          onClick={() => onDelete(row.id, row.full_name)}
          aria-label={`Excluir ${row.full_name}`}
        >
          <FiTrash2 />
        </button>
      </div>
    ),
  };

  const columns = canManageMembers
    ? [...baseColumns, actionsColumn]
    : baseColumns;

  const gridTemplateColumns = canManageMembers
    ? 'minmax(200px, 2fr) minmax(120px, 1fr) 100px 150px 100px'
    : 'minmax(200px, 2fr) minmax(120px, 1fr) 100px 150px';

  return (
    <DataTable<Member>
      data={members}
      columns={columns}
      keyExtractor={(m) => m.id}
      gridTemplateColumns={gridTemplateColumns}
      emptyState={emptyState}
    />
  );
}
