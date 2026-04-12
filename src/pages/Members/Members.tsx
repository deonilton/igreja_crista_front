import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiUsers, FiX } from 'react-icons/fi';
import type { DataTableEmptyState } from '../../components/DataTable';
import Swal, { showSuccess, showError } from '../../utils/swalConfig';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import type { Member, MembersResponse } from '../../types';
import MembersTable from './components/MembersTable';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button';
import './Members.css';

export default function Members() {
  const { hasPermission } = useAuth();
  const canManageMembers = hasPermission('lideranca');
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limit = 10; // Padrão: 10 itens por página

  // Função debounce com cancelamento
  function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      // Cancela o timeout anterior
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => func(...args), delay);
    };
  }

  // Função para formatar telefone
  const formatPhone = (phone: string | null): string => {
    if (!phone) return '—';
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return '—';
    
    if (cleaned.length <= 2) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const clearSearch = (): void => {
    setSearch('');
    setCurrentPage(1); // Reset para primeira página
    // Força carregamento de todos os membros (sem debounce)
    loadMembers(1, false);
  };

  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadMembers(page, false);
  };

  // Carregar membros
  const loadMembers = (pageToLoad: number = currentPage, useDebounce = false) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    params.page = pageToLoad.toString();
    params.limit = limit.toString();

    const request = api.get<MembersResponse>('/members', { params });
    
    if (!useDebounce) {
      setLoading(true);
    }

    request
      .then(response => {
        setMembers(response.data.members);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      })
      .catch(err => {
        void showError('Erro ao carregar membros.');
      })
      .finally(() => {
        if (!useDebounce) {
          setLoading(false);
        }
      });
  };

  // Carregamento inicial
  useEffect(() => {
    loadMembers(1, false);
  }, []);

  // Busca com debounce
  useEffect(() => {
    // Cancela qualquer debounce pendente
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (search || statusFilter) {
      // Configura novo debounce para busca
      debounceRef.current = setTimeout(() => {
        setCurrentPage(1); // Reset para primeira página ao buscar
        loadMembers(1, true);
      }, 500);
    } else if (!search && !statusFilter) {
      // Se ambos estiverem vazios, carrega todos os membros imediatamente
      loadMembers(1, false);
    }
  }, [search, statusFilter]);

  // Limpa debounce ao desmontar
  useEffect(() => {
    return () => {
      // Limpa qualquer timeout pendente
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/membros/${id}/editar`);
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza que deseja excluir este usuário?',
      text: `Você está excluindo "${name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#1e40af',
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f3f4f6'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/members/${id}`);
      await showSuccess('Membro excluído com sucesso!');
      setMembers(members.filter((m) => m.id !== id));
    } catch (err) {
      void showError('Erro ao excluir membro.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        Carregando membros...
      </div>
    );
  }

  const emptyState: DataTableEmptyState = {
    icon: <FiUsers />,
    title:
      statusFilter === 'Visitante'
        ? 'Nenhum visitante encontrado'
        : statusFilter === 'Ativo'
        ? 'Nenhum membro ativo encontrado'
        : statusFilter === 'Inativo'
        ? 'Nenhum membro inativo encontrado'
        : 'Nenhum membro encontrado',
    description:
      statusFilter === 'Visitante'
        ? 'Nenhum visitante cadastrado no momento.'
        : statusFilter === 'Ativo'
        ? 'Nenhum membro ativo encontrado no momento.'
        : statusFilter === 'Inativo'
        ? 'Nenhum membro inativo encontrado no momento.'
        : 'Cadastre o primeiro membro da sua igreja.',
  };

  return (
    <div className="members-page">
      <div className="members-toolbar">
        <div className="members-search">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={clearSearch}
              title="Limpar busca"
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="members-filter">
          <select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
            <option value="Visitante">Visitantes</option>
          </select>
        </div>

        <Button href="/membros/novo" icon={<FiPlus />}>
          Novo Membro
        </Button>
      </div>

      <div className="members-card">
        <MembersTable
          members={members}
          canManageMembers={canManageMembers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          formatPhone={formatPhone}
          emptyState={emptyState}
        />

        {members.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
