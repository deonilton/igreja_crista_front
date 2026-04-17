import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiUserX, FiEye, FiStar } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { DASHBOARD_MINISTRY_CARDS, getOrderedAssignedMinistryLinks } from '../../config/ministryNav';
import api from '../../services/api';
import type { DashboardData, DashboardStats } from '../../types';
import AgeRangeStats from '../../components/AgeRangeStats';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, hasMinistryAccess, hasPermission } = useAuth();

  const assignedMinistryLinks =
    user?.role === 'super_admin' ? [] : getOrderedAssignedMinistryLinks(user?.ministries);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard(): Promise<void> {
    try {
      const response = await api.get<DashboardData>('/dashboard');
      setData(response.data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        Carregando dados...
      </div>
    );
  }

  const stats: DashboardStats = data?.stats || {
    total: 0,
    actives: 0,
    inactives: 0,
    visitors: 0,
    recentRegistrations: 0,
  };

  return (
    <div className="dashboard">
      <div className="dashboard-section-title">
        <h2>Estatísticas Flutuantes - ICF Aparecida</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FiUsers />
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total de Membros</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <FiUserCheck />
          </div>
          <div className="stat-info">
            <h3>{stats.actives}</h3>
            <p>Membros Ativos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <FiUserX />
          </div>
          <div className="stat-info">
            <h3>{stats.inactives}</h3>
            <p>Inativos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <FiEye />
          </div>
          <div className="stat-info">
            <h3>{stats.visitors}</h3>
            <p>Visitantes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon primary">
            <FiStar />
          </div>
          <div className="stat-info">
            <h3>{stats.recentRegistrations}</h3>
            <p>Novos (30 dias)</p>
          </div>
        </div>
      </div>

      {user && user.role !== 'super_admin' && assignedMinistryLinks.length > 0 && (
        <section className="dashboard-assigned-ministries" aria-label="Ministérios do seu usuário">
          <div className="dashboard-section-title">
            <h2>Seus ministérios</h2>
          </div>
          <p className="dashboard-assigned-hint">
            Acesso liberado pelo administrador — {assignedMinistryLinks.length}{' '}
            {assignedMinistryLinks.length === 1 ? 'módulo' : 'módulos'} disponíveis no menu lateral e abaixo.
          </p>
          <div className="assigned-ministries-chips">
            {assignedMinistryLinks.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.id} to={m.to} className="assigned-ministry-chip">
                  <Icon aria-hidden />
                  <span>{m.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {user &&
        user.role !== 'super_admin' &&
        hasPermission('ministerios') &&
        (!user.ministries || user.ministries.length === 0) && (
          <div className="dashboard-ministry-empty-hint" role="status">
            <p>
              Nenhum ministério foi atribuído ao seu usuário. Solicite ao super administrador para vincular os
              módulos em <strong>Usuários</strong>.
            </p>
          </div>
        )}

      <div className="dashboard-section-title">
        <h2>Estatísticas por Faixa Etária</h2>
      </div>
      <AgeRangeStats />

      <div className="dashboard-section-title">
        <h2>Painel de Ministérios  - ICF Aparecida </h2>
      </div>
      <div className="ministries-grid">
        {DASHBOARD_MINISTRY_CARDS.filter((ministry) => hasMinistryAccess(ministry.id)).map((ministry) => (
          <Link key={ministry.id} to={ministry.route} className="ministry-card ministry-card-link">
            <div className="ministry-header">
              <h3>{ministry.title}</h3>
            </div>
            <div className="ministry-content">
              <img
                src="/imagen/icf_logo.png"
                alt="ICF Logo"
                className="ministry-logo"
              />
              <p className="ministry-link-text">Ver detalhes →</p>
            </div>
          </Link>
        ))}
</div>

    </div>
  );
}
