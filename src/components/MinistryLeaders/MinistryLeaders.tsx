import { useState, useEffect } from 'react';
import { FiUsers, FiUser, FiShield } from 'react-icons/fi';
import ministryLeadersService from '../../services/ministryLeadersService';
import type { MinistryWithLeaders, MinistryLeader } from '../../types/ministryLeaders';
import './MinistryLeaders.css';

const MINISTRY_LABELS: Record<string, string> = {
  pequenas_familias: 'Pequenas Famílias',
  evangelismo: 'Evangelismo e Missões',
  diaconia: 'Diaconia',
  louvor: 'Louvor',
  ministerio_infantil: 'Ministério Infantil',
  membros: 'Membros da ICF',
};

function getDisplayName(ministry: MinistryWithLeaders): string {
  return (ministry as any).display_name || MINISTRY_LABELS[ministry.name] || MINISTRY_LABELS[ministry.id] || ministry.name;
}

interface MinistryLeadersProps {
  ministryId?: string;
  showTitle?: boolean;
}

function LeaderCard({ leader }: { leader: MinistryLeader }) {
  const isLeader = leader.role === 'leader';
  
  return (
    <div className={`leader-card ${isLeader ? 'leader' : 'co-leader'}`}>
      <div className="leader-card-icon">
        <FiShield />
      </div>
      <div className="leader-card-info">
        <span className="leader-card-role">
          {isLeader ? 'Líder' : 'Co-Líder'}
        </span>
        <span className="leader-card-name">
          {leader.member?.full_name}
        </span>
      </div>
    </div>
  );
}

function MinistryLeadersView({ ministry, showTitle = true }: { ministry: MinistryWithLeaders; showTitle?: boolean }) {
  const leaders = ministry.leaders.filter(l => l.role === 'leader');
  const coLeaders = ministry.leaders.filter(l => l.role === 'co_leader');
  
  return (
    <div className="ministry-leaders">
      {showTitle && (
        <div className="leaders-title">
          <span>Líderes do Ministério {getDisplayName(ministry)}</span>
        </div>
      )}
      <div className="leaders-grid">
        <div className="leader-column">
          <h4 className="leader-column-title">Líderes ({leaders.length}/2)</h4>
          {leaders.length > 0 ? (
            leaders.map(leader => (
              <LeaderCard key={leader.id} leader={leader} />
            ))
          ) : (
            <div className="leader-empty">
              <FiUser />
              <span>Não definido</span>
            </div>
          )}
        </div>
        <div className="leader-column">
          <h4 className="leader-column-title">Co-Líderes ({coLeaders.length}/2)</h4>
          {coLeaders.length > 0 ? (
            coLeaders.map(leader => (
              <LeaderCard key={leader.id} leader={leader} />
            ))
          ) : (
            <div className="leader-empty">
              <FiUser />
              <span>Não definido</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MinistryLeaders({ ministryId, showTitle = true }: MinistryLeadersProps) {
  const [ministries, setMinistries] = useState<MinistryWithLeaders[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMinistries = async () => {
    setLoading(true);
    try {
      const ministriesData = await ministryLeadersService.getMinistriesWithLeaders();
      setMinistries(ministriesData);
    } catch (error) {
      console.error('Erro ao carregar líderes dos ministérios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMinistries();
  }, []);

  if (loading) {
    return (
      <div className="ministry-leaders-loading">
        <div className="spinner"></div>
        <span>Carregando líderes...</span>
      </div>
    );
  }

  if (ministryId) {
    const ministry = ministries.find(m => m.id === ministryId);
    if (!ministry) {
      return (
        <div className="ministry-leaders-empty">
          <FiUser />
          <span>Ministério não encontrado</span>
        </div>
      );
    }

    return <MinistryLeadersView ministry={ministry} showTitle={showTitle} />;
  }

  return (
    <div className="ministry-leaders-all">
      {showTitle && (
        <div className="all-leaders-header">
          <FiUsers />
          <h3>Líderes dos Ministérios</h3>
        </div>
      )}
      <div className="ministries-leaders-grid">
        {ministries.map(ministry => (
          <div key={ministry.id} className="ministry-leaders-card">
            <div className="ministry-name">{getDisplayName(ministry)}</div>
            <div className="leaders-list">
              {ministry.leaders.length > 0 ? (
                <div className="leaders-grid">
                  <div className="leader-column">
                    <h4 className="leader-column-title">Líderes ({ministry.leaders.filter(l => l.role === 'leader').length}/2)</h4>
                    {ministry.leaders.filter(l => l.role === 'leader').map(leader => (
                      <LeaderCard key={leader.id} leader={leader} />
                    ))}
                  </div>
                  <div className="leader-column">
                    <h4 className="leader-column-title">Co-Líderes ({ministry.leaders.filter(l => l.role === 'co_leader').length}/2)</h4>
                    {ministry.leaders.filter(l => l.role === 'co_leader').map(leader => (
                      <LeaderCard key={leader.id} leader={leader} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-leaders">Sem líderes</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
