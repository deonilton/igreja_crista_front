import { useState, useEffect } from 'react';
import { FiSmile, FiMeh, FiUser, FiUsers, FiHeart } from 'react-icons/fi';
import api from '../../services/api';
import type { AgeRangeStats as AgeRangeStatsType } from '../../types';
import './AgeRangeStats.css';

interface AgeRangeItem {
  key: keyof AgeRangeStatsType;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

export default function AgeRangeStats() {
  const [data, setData] = useState<AgeRangeStatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const ageRanges: AgeRangeItem[] = [
    {
      key: 'children',
      label: 'Crianças (0-12)',
      icon: <FiSmile />,
      colorClass: 'info',
    },
    {
      key: 'teenagers',
      label: 'Adolescentes (13-17)',
      icon: <FiMeh />,
      colorClass: 'purple',
    },
    {
      key: 'youngAdults',
      label: 'Jovens Adultos (18-29)',
      icon: <FiUser />,
      colorClass: 'primary',
    },
    {
      key: 'adults',
      label: 'Adultos (30-59)',
      icon: <FiUsers />,
      colorClass: 'success',
    },
    {
      key: 'elderly',
      label: 'Idosos (60+)',
      icon: <FiHeart />,
      colorClass: 'danger',
    },
  ];

  useEffect(() => {
    loadAgeRangeStats();
  }, []);

  async function loadAgeRangeStats(): Promise<void> {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<AgeRangeStatsType>('/dashboard/age-ranges');
      setData(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas por faixa etária:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="age-range-loading">
        <div className="spinner"></div>
        Carregando estatísticas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="age-range-error">
        <p>{error}</p>
        <button onClick={loadAgeRangeStats}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="age-range-grid">
      {ageRanges.map((range, index) => (
        <div
          key={range.key}
          className="age-range-card"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className={`age-range-icon ${range.colorClass}`}>
            {range.icon}
          </div>
          <div className="age-range-info">
            <h3>{data?.[range.key] ?? 0}</h3>
            <p>{range.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
