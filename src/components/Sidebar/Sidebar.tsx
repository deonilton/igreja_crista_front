import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiLogOut, FiSettings, FiUser, FiLock, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MINISTRY_NAV_ITEMS } from '../../config/ministryNav';
import Swal from '../../utils/swalConfig';
import ChangePasswordModal from '../ChangePasswordModal';
import './Sidebar.css';

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const getInitials = (name?: string): string => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getDisplayName = (name?: string): string => {
    if (!name) return 'Admin';
    return name.trim().split(' ')[0];
  };

  const canAccessUsers = hasPermission('usuarios');
  const canAccessPastoralRoom = hasPermission('pastoral_room');
  const canAccessMembros = hasPermission('membros');

  const visibleMinistryNavItems = MINISTRY_NAV_ITEMS.filter((item) =>
    hasPermission('ministerios', item.id)
  );

  const hasAnyMinistryAccess = visibleMinistryNavItems.length > 0;

  const handleLogoutClick = async () => {
    const result = await Swal.fire({
      title: 'Tem certeza que deseja sair?',
      text: 'Você será desconectado do painel administrativo',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#1e40af',
      confirmButtonText: 'Sair',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f3f4f6'
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img src="/imagen/icf_logo.png" alt="Logo ICF" className="sidebar-logo-img" />
          </div>
          <div className="sidebar-brand-text">
            <h2>ICF - Aparecida</h2>
            <span>Painel Administrativo</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-title">Menu Principal</span>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-link-icon"><FiHome /></span>
          Dashboard 
        </NavLink>

        {canAccessMembros && (
          <NavLink
            to="/membros"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon"><FiUsers /></span>
            Membros
          </NavLink>
        )}

        {canAccessPastoralRoom && (
          <NavLink
            to="/sala-pastoral/painel"
            className={() => `sidebar-link ${pathname.startsWith('/sala-pastoral') ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon"><FiUser /></span>
            Sala Pastoral
          </NavLink>
        )}

        {canAccessUsers && (
          <>
            <span className="sidebar-section-title">Administração</span>
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-link-icon"><FiSettings /></span>
              Gerenciar Usuários
            </NavLink>
          </>
        )}

        {hasAnyMinistryAccess && (
          <span className="sidebar-section-title">Ministérios</span>
        )}

        {visibleMinistryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-link-icon"><Icon /></span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-menu-container">
            <button
              className="sidebar-user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title="Menu do usuário"
            >
              <div className="sidebar-avatar">{getInitials(user?.name)}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{getDisplayName(user?.name)}</div>
              </div>
              <div className="sidebar-user-chevron">
                {showUserMenu ? <FiChevronUp /> : <FiChevronDown />}
              </div>
            </button>

            {showUserMenu && (
              <div className="user-dropdown-menu">
                <button
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowChangePasswordModal(true);
                  }}
                >
                  <FiLock />
                  <span>Alterar Senha</span>
                </button>
                <div className="user-dropdown-divider" />
                <button
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogoutClick();
                  }}
                >
                  <FiLogOut />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </aside>
  );
}
