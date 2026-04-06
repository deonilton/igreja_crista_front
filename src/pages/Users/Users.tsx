import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiUsers } from 'react-icons/fi';
import Swal from '../../utils/swalConfig';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import UserModal from './UserModal';
import MinistryLeadersManager from './MinistryLeadersManager';
import Button from '../../components/Button/Button';
import './Users.css';

const showToast = (type: 'success' | 'error', message: string) => {
  Swal.fire({
    icon: type,
    title: type === 'success' ? 'Sucesso!' : 'Erro!',
    text: message,
    timer: 3000,
    showConfirmButton: false,
  });
};

interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'colaborador';
  ministries: string[];
  created_at: string;
}

export default function Users() {
  const { user: currentUser, hasPermission } = useAuth();
  const canManageUsers = hasPermission('usuarios');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [leadersManagerOpen, setLeadersManagerOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (err) {
      showToast('error', 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  function handleNewUser() {
    setSelectedUser(null);
    setModalOpen(true);
  }

  function handleEditUser(user: User) {
    setSelectedUser(user);
    setModalOpen(true);
  }

  async function handleDeleteUser(userId: number) {
    const result = await Swal.fire({
      title: 'Tem certeza que deseja excluir este usuário?',
      text: 'Esta ação não pode ser desfeita',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#1e40af',
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f3f4f6'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/users/${userId}`);
      showToast('success', 'Usuário excluído com sucesso!');
      loadUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Erro ao excluir usuário');
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setSelectedUser(null);
    loadUsers();
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      super_admin: { label: 'Super Admin', class: 'super-admin' },
      admin: { label: 'Admin', class: 'admin' },
      colaborador: { label: 'Colaborador', class: 'colaborador' },
    };
    return badges[role as keyof typeof badges] || badges.colaborador;
  };

  const getMinistryLabels = (ministries: string[]) => {
    const labels: Record<string, string> = {
      pequenas_familias: 'Pequenas Famílias',
      evangelismo: 'Evangelismo',
      diaconia: 'Diaconia',
      louvor: 'Louvor',
      ministerio_infantil: 'Min. Infantil',
      membros: 'Membros',
    };
    return ministries.map(m => labels[m] || m).join(', ');
  };

  if (!canManageUsers) {
    return (
      <div className="users-page">
        <div className="access-denied">
          <FiShield size={48} />
          <h2>Acesso Negado</h2>
          <p>Você não tem permissão para gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="users-loading">
        <div className="spinner"></div>
        Carregando usuários...
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>Gerenciar Usuários</h1>
          <p>Controle de acesso e permissões de administradores</p>
        </div>
        <div className="header-buttons">
          <Button variant="secondary" size="md" onClick={() => setLeadersManagerOpen(true)} icon={<FiUsers />}>
            Líderes de Ministérios
          </Button>
          <Button variant="primary" size="md" onClick={handleNewUser} icon={<FiPlus />}>
            Novo Usuário
          </Button>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Tipo de Acesso</th>
              <th>Ministérios</th>
              <th>Cadastrado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const roleBadge = getRoleBadge(user.role);
              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${roleBadge.class}`}>
                      {roleBadge.label}
                    </span>
                  </td>
                  <td className="ministries-cell">
                    {user.role === 'super_admin' ? (
                      <span className="all-access">Acesso Total</span>
                    ) : user.ministries?.length > 0 ? (
                      getMinistryLabels(user.ministries)
                    ) : (
                      <span className="no-access">Nenhum</span>
                    )}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEditUser(user)}
                        title="Editar"
                      >
                        <FiEdit2 />
                      </button>
                      {currentUser && user.id !== currentUser.id && (
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Excluir"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <p>Nenhum usuário cadastrado ainda.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <UserModal
          user={selectedUser}
          onClose={handleModalClose}
        />
      )}

      {leadersManagerOpen && (
        <MinistryLeadersManager
          isOpen={leadersManagerOpen}
          onClose={() => setLeadersManagerOpen(false)}
        />
      )}
    </div>
  );
}
