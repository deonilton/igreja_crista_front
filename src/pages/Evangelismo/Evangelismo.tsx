import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { FiPlus, FiTrash2, FiUsers, FiX, FiSearch, FiUser, FiUserCheck, FiFileText, FiAlertCircle, FiCalendar, FiHome, FiArrowUp, FiMapPin } from 'react-icons/fi';
import Swal, { showSuccess, showError } from '../../utils/swalConfig';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { CasaDePaz, CasasDePazResponse, MemberSearchResult, FullCasaDePaz } from '../../types/casaDePaz';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button';
import MinistryLeaders from '../../components/MinistryLeaders/MinistryLeaders';
import EvangelismoReportModal from './EvangelismoReportModal';
import CasaDePazModal from './CasaDePazModal';
import ViewCasaDePazModal from './ViewCasaDePazModal';
import OccurrenceModal from './OccurrenceModal';
import './Evangelismo.css';

export default function Evangelismo() {
  const { hasPermission, hasMinistryAccess, user } = useAuth();
  const canManageEvangelismo = hasPermission('lideranca');
  const isColaborador = user?.role === 'colaborador';
  const canCreateCasaDePaz = canManageEvangelismo || (user?.role === 'admin' && hasMinistryAccess('evangelismo'));
  
  const [leaders, setLeaders] = useState<CasaDePaz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  
  const [statistics, setStatistics] = useState<{ total: number, men: number, women: number }>({
    total: 0,
    men: 0,
    women: 0
  });
  const [statisticsLoading, setStatisticsLoading] = useState<boolean>(true);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  
  const [editingLeader, setEditingLeader] = useState<CasaDePaz | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  
  const [activeTab, setActiveTab] = useState<'relatorio' | 'ocorrencias' | 'eventos'>('relatorio');
  
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [occurrencesLoading, setOccurrencesLoading] = useState(false);
  
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [showCreateCasaModal, setShowCreateCasaModal] = useState(false);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [fullCasas, setFullCasas] = useState<FullCasaDePaz[]>([]);
  const [fullCasasLoading, setFullCasasLoading] = useState(false);
  const [showViewCasaModal, setShowViewCasaModal] = useState(false);
  const [selectedCasa, setSelectedCasa] = useState<FullCasaDePaz | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const limit = 10;

  function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => func(...args), delay);
    };
  }

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

  const searchMembers = debounce(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get<MemberSearchResult[]>('/deacons/search-members', {
        params: { query: query.trim() }
      });
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, 300);

  const loadStatistics = () => {
    setStatisticsLoading(true);
    api.get<{ total: number, men: number, women: number }>('/evangelismo/statistics')
      .then(response => {
        setStatistics(response.data);
      })
      .catch(err => {
        console.error('Erro ao carregar estatísticas:', err);
      })
      .finally(() => {
        setStatisticsLoading(false);
      });
  };

  const loadLeaders = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    params.page = currentPage.toString();
    params.limit = limit.toString();

    api.get<CasasDePazResponse>('/evangelismo/leaders', { params })
      .then(response => {
        setLeaders(response.data.casas);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      })
      .catch(err => {
        showError('Erro ao carregar líderes de evangelismo.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAddLeader = async () => {
    if (!selectedMember) {
      showError('Selecione um membro para adicionar como líder de evangelismo.');
      return;
    }

    try {
      await api.post('/evangelismo/leaders', { member_id: selectedMember.id });
      showSuccess('Líder de evangelismo adicionado com sucesso!');
      setSelectedMember(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      loadStatistics();
      loadLeaders();
    } catch (error: any) {
      if (error.response?.status === 409) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção!',
          text: 'Este membro já é um líder de evangelismo.',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        }).then(() => {
          setSelectedMember(null);
          setSearchQuery('');
          setSearchResults([]);
          setShowSearchResults(false);
        });
      } else if (error.response?.status === 404) {
        showError('Membro não encontrado.');
      } else {
        showError('Erro ao adicionar líder de evangelismo.');
      }
    }
  };

  const handleEditLeader = (leader: CasaDePaz) => {
    setEditingLeader(leader);
    setSelectedMember({
      id: leader.member?.id || 0,
      full_name: leader.member?.full_name || '',
      email: leader.member?.email || null,
      phone: leader.member?.phone || null
    });
    setSearchQuery(leader.member?.full_name || '');
  };

  const handleSaveEdit = async () => {
    if (!editingLeader || !selectedMember) {
      showError('Selecione um membro para atualizar.');
      return;
    }

    try {
      await api.put(`/evangelismo/leaders/${editingLeader.id}`, { member_id: selectedMember.id });
      showSuccess('Líder de evangelismo atualizado com sucesso!');
      setEditingLeader(null);
      setSelectedMember(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      loadLeaders();
    } catch (error: any) {
      if (error.response?.status === 409) {
        showError('Este membro já é um líder de evangelismo.');
      } else if (error.response?.status === 404) {
        showError('Membro não encontrado.');
      } else {
        showError('Erro ao atualizar líder de evangelismo.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingLeader(null);
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleDeleteLeader = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza que deseja remover este líder?',
      text: `Você está removendo "${name}" dos líderes de evangelismo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#1e40af',
      confirmButtonText: 'Remover',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f3f4f6'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/evangelismo/leaders/${id}`);
      showSuccess('Líder removido com sucesso!');
      loadStatistics();
      loadLeaders();
    } catch (error) {
      showError('Erro ao remover líder.');
    }
  };

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setSearchQuery(member.full_name);
    setShowSearchResults(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadLeaders();
  };

  const loadOccurrences = async () => {
    setOccurrencesLoading(true);
    try {
      const response = await api.get('/occurrences?ministry_id=evangelismo');
      setOccurrences(response.data.occurrences || []);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'Erro ao carregar ocorrências',
        background: '#f9fafb',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setOccurrencesLoading(false);
    }
  };

  const loadReports = async (page: number = 1) => {
    setReportsLoading(true);
    try {
      const response = await api.get(`/evangelismo/reports?page=${page}&limit=10`);
      setReports(response.data.reports || []);
      setReportsTotalPages(response.data.totalPages || 1);
      setReportsPage(page);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleReportSuccess = () => {
    loadReports(reportsPage);
  };

  const handleCreateCasaSuccess = () => {
    loadLeaders();
    loadStatistics();
    loadFullCasas();
  };

  const handleOccurrenceSuccess = () => {
    loadOccurrences();
  };

  const handleViewCasa = (casa: FullCasaDePaz) => {
    setSelectedCasa(casa);
    setShowViewCasaModal(true);
  };

  const loadFullCasas = async () => {
    setFullCasasLoading(true);
    try {
      const response = await api.get('/evangelismo/casas-de-paz');
      setFullCasas(response.data);
    } catch (error) {
      console.error('Erro ao carregar Casas de Paz:', error);
    } finally {
      setFullCasasLoading(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não poderá ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      background: '#f0f9ff'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/evangelismo/reports/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: 'Relatório excluído com sucesso!',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
        loadReports(reportsPage);
      } catch (error) {
        console.error('Erro ao excluir relatório:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: 'Erro ao excluir relatório',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadLeaders();
    loadStatistics();
    loadFullCasas();
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'relatorio') {
      loadReports();
    } else if (activeTab === 'ocorrencias') {
      loadOccurrences();
    }
  }, [activeTab]);

  useEffect(() => {
    searchMembers(searchQuery);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        Carregando evangelismo...
      </div>
    );
  }

  return (
    <div className="diaconia-page">
      <div className="diaconia-ministry-leaders-card">
        <MinistryLeaders ministryId="evangelismo" showTitle={true} />
      </div>

      <div className="diaconia-stats-card">
        <h3>Líderes de Evangelismo e Missões - ICF Aparecida</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-info">
              <div className="stat-number">{statistics.total}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon male">
              <FiUser />
            </div>
            <div className="stat-info">
              <div className="stat-number">{statistics.men}</div>
              <div className="stat-label">Homens</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon female">
              <FiUserCheck />
            </div>
            <div className="stat-info">
              <div className="stat-number">{statistics.women}</div>
              <div className="stat-label">Mulheres</div>
            </div>
          </div>
        </div>
      </div>

      {canCreateCasaDePaz && (
        <>
          <div className="diaconia-stats-card">
            <div className="card-header-with-action">
              <h3>Casas de Paz</h3>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateCasaModal(true)}
                icon={<FiPlus />}
              >
                Criar Casa de Paz
              </Button>
            </div>
            <p className="card-description">
              Cadastre e gerencie as casas de paz da igreja, incluindo informações sobre responsáveis, endereços e membros.
            </p>
          </div>

          {/* Lista de Casas de Paz */}
          <div className="small-families-grid">
            {fullCasasLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Carregando Casas de Paz...</p>
              </div>
            ) : fullCasas.length > 0 ? (
              fullCasas.map((casa) => (
                <div 
                  key={casa.id} 
                  className="small-family-card clickable"
                  onClick={() => handleViewCasa(casa)}
                >
                  <div className="family-card-simple">
                    <FiMapPin className="family-icon" />
                    <h4>{casa.name}</h4>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FiMapPin size={48} />
                <h3>Nenhuma Casa de Paz cadastrada</h3>
                <p>Clique em "Criar Casa de Paz" para começar.</p>
              </div>
            )}
          </div>
        </>
      )}

      <div className="diaconia-tabs-card">
        <h3>Ações Rápidas</h3>
        <div className="tabs-container">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'relatorio' ? 'active' : ''}`}
              onClick={() => setActiveTab('relatorio')}
            >
              <FiFileText />
              Relatório de Evangelismo
            </button>
            <button
              className={`tab-button ${activeTab === 'ocorrencias' ? 'active' : ''}`}
              onClick={() => setActiveTab('ocorrencias')}
            >
              <FiAlertCircle />
              Registrar Ocorrências
            </button>
            <button
              className={`tab-button ${activeTab === 'eventos' ? 'active' : ''}`}
              onClick={() => setActiveTab('eventos')}
            >
              <FiCalendar />
              Eventos
            </button>
          </div>
          
          <div className="tabs-content">
            {activeTab === 'relatorio' && (
              <div className="tab-content">
                <div className="cult-reports-section">
                  <div className="cult-reports-header">
                    <h3>Relatórios de Evangelismo</h3>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setShowReportModal(true)}
                      icon={<FiPlus />}
                    >
                      Novo Relatório
                    </Button>
                  </div>

                  {reportsLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Carregando relatórios...</p>
                    </div>
                  ) : reports.length > 0 ? (
                    <>
                      <div className="cult-reports-table-container">
                        <table className="cult-reports-table">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Responsável</th>
                              <th>Novos Visitantes</th>
                              <th>Conversões</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reports.map((report) => (
                              <tr key={report.id}>
                                <td>
                                  <div className="table-date">
                                    <FiCalendar />
                                    {new Date(report.cult_date).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td>{report.responsavel}</td>
                                <td>{report.new_visitors || 0}</td>
                                <td>{report.conversions || 0}</td>
                                <td>
                                  <div className="table-actions">
                                    <Button
                                      variant="action-edit"
                                      size="sm"
                                      disabled={isColaborador}
                                      onClick={() => {
                                        if (isColaborador) return;
                                        setEditingReport(report);
                                        setShowReportModal(true);
                                      }}
                                      icon={<FiUser />}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      variant="action-delete"
                                      size="sm"
                                      disabled={isColaborador}
                                      onClick={() => {
                                        if (isColaborador) return;
                                        handleDeleteReport(report.id);
                                      }}
                                      icon={<FiTrash2 />}
                                    >
                                      Excluir
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {reportsTotalPages > 1 && (
                        <Pagination
                          currentPage={reportsPage}
                          totalPages={reportsTotalPages}
                          total={reports.length}
                          limit={10}
                          onPageChange={(page) => loadReports(page)}
                        />
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <FiFileText />
                      <h3>Nenhum relatório encontrado</h3>
                      <p>Os relatórios de evangelismo aparecem aqui.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'ocorrencias' && (
              <div className="tab-content">
                <div className="cult-reports-section">
                  <div className="cult-reports-header">
                    <h3>Ocorrências Registradas</h3>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setShowOccurrenceModal(true)}
                      icon={<FiPlus />}
                    >
                      Nova Ocorrência
                    </Button>
                  </div>

                  {occurrencesLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Carregando ocorrências...</p>
                    </div>
                  ) : occurrences.length > 0 ? (
                    <>
                      <div className="cult-reports-table-container">
                        <table className="cult-reports-table">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Responsável</th>
                              <th>Local</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {occurrences.map((occurrence) => (
                              <tr key={occurrence.id}>
                                <td>
                                  <div className="table-date">
                                    <FiCalendar />
                                    {new Date(occurrence.date).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td>{occurrence.reporter_name}</td>
                                <td>{occurrence.location}</td>
                                <td>
                                  <div className="table-actions">
                                    <Button
                                      variant="action-edit"
                                      size="sm"
                                      icon={<FiUser />}
                                    >
                                      Ver
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <FiAlertCircle />
                      <h3>Nenhuma ocorrência registrada</h3>
                      <p>As ocorrências aparecem aqui.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
                        
            {activeTab === 'eventos' && (
              <div className="tab-content">
                <div className="action-button secondary">
                  <FiCalendar />
                  <div className="action-content">
                    <span className="action-title">Gerenciar Eventos</span>
                    <span className="action-description">Criar e gerenciar eventos da igreja</span>
                  </div>
                </div>
                <div className="coming-soon">
                  <p>Em breve: Sistema completo de gestão de eventos</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="diaconia-header">
        <h1>Evangelismo e Missões</h1>
        <p>Gestão de líderes de evangelismo e casas de paz</p>
      </div>

      <div className="diaconia-form-card">
        <h3>{editingLeader ? 'Editar Líder' : 'Adicionar Líder de Evangelismo'}</h3>
        
        <div className="member-search-container" ref={searchRef}>
          <div className="search-input-wrapper">
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
              {searchQuery && !editingLeader && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMember(null);
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  title="Limpar busca"
                >
                  <FiX />
                </button>
              )}
            </div>
            
            {editingLeader ? (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveEdit}
                  disabled={!selectedMember}
                >
                  Salvar Alterações
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleAddLeader}
                disabled={!selectedMember}
                icon={<FiPlus />}
              >
                Adicionar Líder
              </Button>
            )}
          </div>

          {showSearchResults && !selectedMember && (
            <div className="search-results">
              {searchLoading ? (
                <div className="search-loading">Buscando...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(member => (
                  <div
                    key={member.id}
                    className="search-result-item"
                    onClick={() => handleSelectMember(member)}
                  >
                    <div className="member-info">
                      <div className="member-name">{member.full_name}</div>
                      {member.email && (
                        <div className="member-email">{member.email}</div>
                      )}
                      {member.phone && (
                        <div className="member-phone">{formatPhone(member.phone)}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="search-empty">Nenhum membro encontrado</div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="diaconia-list-card">
        <h3>Líderes de Evangelismo ({total})</h3>
        
        {leaders.length > 0 ? (
          <>
            <table className="diaconia-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Data de Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map(leader => (
                  <tr key={leader.id}>
                    <td>
                      <div className="deacon-name">{leader.member?.full_name}</div>
                    </td>
                    <td>
                      {leader.member?.email || '—'}
                    </td>
                    <td>{formatPhone(leader.member?.phone || null)}</td>
                    <td>
                      {new Date(leader.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className="deacon-actions">
                        <Button
                          variant="action-delete"
                          size="sm"
                          disabled={isColaborador}
                          onClick={() => {
                            if (isColaborador) return;
                            handleDeleteLeader(leader.id, leader.member?.full_name || '');
                          }}
                          icon={<FiTrash2 />}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="deacons-empty">
            <div className="deacons-empty-icon">
              <FiUsers />
            </div>
            <h3>Nenhum líder encontrado</h3>
            <p>Adicione o primeiro líder usando o formulário acima.</p>
          </div>
        )}
      </div>

      <EvangelismoReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setEditingReport(null);
        }}
        onSuccess={handleReportSuccess}
        editingReport={editingReport}
        casas={leaders}
      />

      <CasaDePazModal
        isOpen={showCreateCasaModal}
        onClose={() => setShowCreateCasaModal(false)}
        onSuccess={handleCreateCasaSuccess}
      />

      <ViewCasaDePazModal
        isOpen={showViewCasaModal}
        onClose={() => {
          setShowViewCasaModal(false);
          setSelectedCasa(null);
        }}
        casa={selectedCasa}
      />

      <OccurrenceModal
        isOpen={showOccurrenceModal}
        onClose={() => setShowOccurrenceModal(false)}
        onSuccess={handleOccurrenceSuccess}
        ministryId="evangelismo"
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
        >
          <FiArrowUp />
        </button>
      )}
    </div>
  );
}
