import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiLogOut, FiBookOpen, FiHeart, FiSend, FiGift, FiMusic, FiSmile, FiSettings, FiFileText, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import Swal from '../../utils/swalConfig';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth();

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
  const canAccessDiaconia = hasPermission('ministerios', 'diaconia');
  const canAccessPequenasFamilias = hasPermission('ministerios', 'pequenas_familias');
  const canAccessEvangelismo = hasPermission('ministerios', 'evangelismo');
  const canAccessLouvor = hasPermission('ministerios', 'louvor');
  const canAccessMinisterioInfantil = hasPermission('ministerios', 'ministerio_infantil');

  const hasAnyMinistryAccess =
    canAccessPequenasFamilias ||
    canAccessEvangelismo ||
    canAccessDiaconia ||
    canAccessLouvor ||
    canAccessMinisterioInfantil;

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

        <NavLink
          to="/membros"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-link-icon"><FiUsers /></span>
          Membros
        </NavLink>

        {canAccessPastoralRoom && (
          <NavLink
            to="/sala-pastoral"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
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

        {canAccessPequenasFamilias && (
          <NavLink
            to="/pequenas-familias"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon"><FiHeart /></span>
            Pequenas Famílias
          </NavLink>
        )}

        {canAccessEvangelismo && (
          <NavLink
            to="/evangelismo"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon"><FiSend /></span>
            Evangelismo e Missões
          </NavLink>
        )}

        {canAccessDiaconia && (
          <NavLink
            to="/diaconia"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon"><FiGift /></span>
            Diaconia
          </NavLink>
        )}

        {canAccessLouvor && (
          <NavLink
            to="/louvor"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon"><FiMusic /></span>
            Louvor
          </NavLink>
        )}

        {canAccessMinisterioInfantil && (
          <NavLink
            to="/ministerio-infantil"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon"><FiSmile /></span>
            Ministério Infantil
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{getDisplayName(user?.name)}</div>
            {/* <div className="sidebar-user-role">{user?.role || 'admin'}</div> */}
          </div>
          <button onClick={handleLogoutClick} className="btn btn-secondary" title="Sair">
            <FiLogOut />
            <span>Sair</span>
          </button>
        </div>
      </div>

    </aside>
  );
}
