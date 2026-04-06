import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiUserX, FiEye, FiStar } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import type { DashboardData, DashboardStats } from '../../types';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { hasMinistryAccess } = useAuth();

  // Mapping of ministry IDs from UserModal to dashboard routes
  const ministries = [
    {
      id: 'pequenas_familias',
      title: 'Pequenas Famílias',
      route: '/pequenas-familias'
    },
    {
      id: 'evangelismo',
      title: 'Evangelismo e Missões - Casa de Paz',
      route: '/evangelismo'
    },
    {
      id: 'diaconia',
      title: 'Diaconia',
      route: '/diaconia'
    },
    {
      id: 'louvor',
      title: 'Louvor',
      route: '/louvor'
    },
    {
      id: 'ministerio_infantil',
      title: 'Ministério Infantil',
      route: '/ministerio-infantil'
    },
    {
      id: 'membros',
      title: 'Membros da ICF - Aparecida',
      route: '/membros'
    }
  ];

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
        <h2>Estatísticas</h2>
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

      <div className="dashboard-section-title">
        <h2>Ministérios</h2>
      </div>
      <div className="ministries-grid">
        {ministries
          .filter(ministry => hasMinistryAccess(ministry.id))
          .map(ministry => (
            <Link key={ministry.id} to={ministry.route} className="ministry-card ministry-card-link">
              <div className="ministry-header">
                <h3>{ministry.title}</h3>
              </div>
              <div className="ministry-content">
                <p>Ver detalhes →</p>
              </div>
            </Link>
          ))}
      </div>

    </div>
  );
}
