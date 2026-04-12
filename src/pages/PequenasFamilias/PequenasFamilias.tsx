import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { FiPlus, FiTrash2, FiUsers, FiX, FiSearch, FiUser, FiUserCheck, FiFileText, FiAlertCircle, FiCalendar, FiHome, FiArrowUp } from 'react-icons/fi';
import Swal, { showSuccess, showError, showWarning } from '../../utils/swalConfig';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { SmallFamily, SmallFamiliesResponse, MemberSearchResult, FullSmallFamily } from '../../types/smallFamilies';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button';
import MinistryLeaders from '../../components/MinistryLeaders/MinistryLeaders';
import SmallFamilyReportModal from './SmallFamilyReportModal';
import CreateSmallFamilyModal from './CreateSmallFamilyModal';
import ViewSmallFamilyModal from './ViewSmallFamilyModal';
import OccurrenceModal from './OccurrenceModal';
import './PequenasFamilias.css';

export default function PequenasFamilias() {
  const { hasPermission, hasMinistryAccess, user } = useAuth();
  const canManageSmallFamilies = hasPermission('lideranca');
  const isColaborador = user?.role === 'colaborador';
  const canCreateSmallFamily = canManageSmallFamilies || (user?.role === 'admin' && hasMinistryAccess('pequenas_familias'));
  const [families, setFamilies] = useState<SmallFamily[]>([]);
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
  
  const [editingFamily, setEditingFamily] = useState<SmallFamily | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  
  const [activeTab, setActiveTab] = useState<'relatorio' | 'ocorrencias' | 'eventos'>('relatorio');
  
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [occurrencesLoading, setOccurrencesLoading] = useState(false);
  
  const [cultReports, setCultReports] = useState<any[]>([]);
  const [cultReportsLoading, setCultReportsLoading] = useState(false);
  const [cultReportsPage, setCultReportsPage] = useState(1);
  const [cultReportsTotalPages, setCultReportsTotalPages] = useState(1);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [showCreateFamilyModal, setShowCreateFamilyModal] = useState(false);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [fullFamilies, setFullFamilies] = useState<FullSmallFamily[]>([]);
  const [fullFamiliesLoading, setFullFamiliesLoading] = useState(false);
  const [showViewFamilyModal, setShowViewFamilyModal] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FullSmallFamily | null>(null);
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
    api.get<{ total: number, men: number, women: number }>('/small-families/statistics')
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

  const loadFamilies = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    params.page = currentPage.toString();
    params.limit = limit.toString();

    api.get<SmallFamiliesResponse>('/small-families', { params })
      .then(response => {
        setFamilies(response.data.families);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      })
      .catch(err => {
        void showError('Erro ao carregar pequenas famílias.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAddFamily = async () => {
    if (!selectedMember) {
      void showError('Selecione um membro para adicionar como líder de pequena família.');
      return;
    }

    try {
      await api.post('/small-families', { member_id: selectedMember.id });
      await showSuccess('Líder de pequena família adicionado com sucesso!');
      setSelectedMember(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      loadStatistics();
      loadFamilies();
    } catch (error: any) {
      if (error.response?.status === 409) {
        await showWarning('Este membro já é um líder de pequena família.', 'Atenção!');
        setSelectedMember(null);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
      } else if (error.response?.status === 404) {
        void showError('Membro não encontrado.');
      } else {
        void showError('Erro ao adicionar líder de pequena família.');
      }
    }
  };

  const handleEditFamily = (family: SmallFamily) => {
    setEditingFamily(family);
    setSelectedMember({
      id: family.member?.id || 0,
      full_name: family.member?.full_name || '',
      email: family.member?.email || null,
      phone: family.member?.phone || null
    });
    setSearchQuery(family.member?.full_name || '');
  };

  const handleSaveEdit = async () => {
    if (!editingFamily || !selectedMember) {
      void showError('Selecione um membro para atualizar.');
      return;
    }

    try {
      await api.put(`/small-families/${editingFamily.id}`, { member_id: selectedMember.id });
      await showSuccess('Líder de pequena família atualizado com sucesso!');
      setEditingFamily(null);
      setSelectedMember(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      loadFamilies();
    } catch (error: any) {
      if (error.response?.status === 409) {
        void showWarning('Este membro já é um líder de pequena família.', 'Atenção!');
      } else if (error.response?.status === 404) {
        void showError('Membro não encontrado.');
      } else {
        void showError('Erro ao atualizar líder de pequena família.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingFamily(null);
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleDeleteFamily = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza que deseja remover este líder?',
      text: `Você está removendo "${name}" das pequenas famílias.`,
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
      await api.delete(`/small-families/${id}`);
      await showSuccess('Líder removido com sucesso!');
      loadStatistics();
      loadFamilies();
    } catch (error) {
      void showError('Erro ao remover líder.');
    }
  };

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setSearchQuery(member.full_name);
    setShowSearchResults(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadFamilies();
  };

  const loadOccurrences = async () => {
    setOccurrencesLoading(true);
    try {
      const response = await api.get('/occurrences?ministry_id=pequenas_familias');
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

  const loadSmallFamilyReports = async (page: number = 1) => {
    setCultReportsLoading(true);
    try {
      const response = await api.get(`/small-family-reports?page=${page}&limit=10`);
      setCultReports(response.data.reports || []);
      setCultReportsTotalPages(response.data.totalPages || 1);
      setCultReportsPage(page);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setCultReportsLoading(false);
    }
  };

  const handleReportSuccess = () => {
    loadSmallFamilyReports(cultReportsPage);
  };

  const handleCreateFamilySuccess = () => {
    loadFamilies();
    loadStatistics();
    loadFullFamilies();
  };

  const handleOccurrenceSuccess = () => {
    loadOccurrences();
  };

  const handleViewFamily = (family: FullSmallFamily) => {
    setSelectedFamily(family);
    setShowViewFamilyModal(true);
  };

  const loadFullFamilies = async () => {
    setFullFamiliesLoading(true);
    try {
      const response = await api.get('/small-families/full-families');
      console.log('=== DEBUG LOAD FAMILIES ===');
      console.log('Famílias recebidas da API:', response.data);
      console.log('===========================');
      setFullFamilies(response.data);
    } catch (error) {
      console.error('Erro ao carregar Pequenas Famílias:', error);
    } finally {
      setFullFamiliesLoading(false);
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
        await api.delete(`/small-family-reports/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: 'Relatório excluído com sucesso!',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
        loadSmallFamilyReports(cultReportsPage);
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
    loadFamilies();
    loadStatistics();
    loadFullFamilies();
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
      loadSmallFamilyReports();
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
        Carregando pequenas famílias...
      </div>
    );
  }

  return (
    <div className="diaconia-page">
      <div className="diaconia-ministry-leaders-card">
        <MinistryLeaders ministryId="pequenas_familias" showTitle={true} />
      </div>

      <div className="diaconia-stats-card">
        <h3>Líderes de Pequenas Famílias - ICF Aparecida</h3>
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

      {canCreateSmallFamily && (
        <>
          <div className="diaconia-stats-card">
            <div className="card-header-with-action">
              <h3>Pequenas Famílias</h3>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateFamilyModal(true)}
                icon={<FiPlus />}
              >
                Criar Pequena Família
              </Button>
            </div>
            <p className="card-description">
              Cadastre e gerencie as pequenas famílias da igreja, incluindo informações sobre responsáveis, endereços e membros.
            </p>
          </div>

          {/* Lista de Pequenas Famílias */}
          <div className="small-families-grid">
            {fullFamiliesLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Carregando Pequenas Famílias...</p>
              </div>
            ) : fullFamilies.length > 0 ? (
              fullFamilies.map((family) => (
                <div 
                  key={family.id} 
                  className="small-family-card clickable"
                  onClick={() => handleViewFamily(family)}
                >
                  <div className="family-card-simple">
                    <FiHome className="family-icon" />
                    <h4>{family.name}</h4>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FiHome size={48} />
                <h3>Nenhuma Pequena Família cadastrada</h3>
                <p>Clique em "Criar Pequena Família" para começar.</p>
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
              Relatório de Pequena Família
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
                    <h3>Relatórios de Pequena Família</h3>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setShowReportModal(true)}
                      icon={<FiPlus />}
                    >
                      Novo Relatório
                    </Button>
                  </div>

                  {cultReportsLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Carregando relatórios...</p>
                    </div>
                  ) : cultReports.length > 0 ? (
                    <>
                      <div className="cult-reports-table-container">
                        <table className="cult-reports-table">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Responsável</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cultReports.map((report) => (
                              <tr key={report.id}>
                                <td>
                                  <div className="table-date">
                                    <FiCalendar />
                                    {new Date(report.cult_date).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td>{report.responsavel || report.ministro}</td>
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
                      {cultReportsTotalPages > 1 && (
                        <Pagination
                          currentPage={cultReportsPage}
                          totalPages={cultReportsTotalPages}
                          total={cultReports.length}
                          limit={10}
                          onPageChange={(page) => loadSmallFamilyReports(page)}
                        />
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <FiFileText />
                      <h3>Nenhum relatório encontrado</h3>
                      <p>Os relatórios de pequena família aparecem aqui.</p>
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
        <h1>Pequenas Famílias</h1>
        <p>Gestão de líderes de pequenas famílias da igreja</p>
      </div>

      <div className="diaconia-form-card">
        <h3>{editingFamily ? 'Editar Líder' : 'Adicionar Líder de Pequena Família'}</h3>
        
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
              {searchQuery && !editingFamily && (
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
            
            {editingFamily ? (
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
                onClick={handleAddFamily}
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
        <h3>Líderes de Pequenas Famílias ({total})</h3>
        
        {families.length > 0 ? (
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
                {families.map(family => (
                  <tr key={family.id}>
                    <td>
                      <div className="deacon-name">{family.member?.full_name}</div>
                    </td>
                    <td>
                      {family.member?.email || '—'}
                    </td>
                    <td>{formatPhone(family.member?.phone || null)}</td>
                    <td>
                      {new Date(family.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className="deacon-actions">
                        <Button
                          variant="action-delete"
                          size="sm"
                          disabled={isColaborador}
                          onClick={() => {
                            if (isColaborador) return;
                            handleDeleteFamily(family.id, family.member?.full_name || '');
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

      <SmallFamilyReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setEditingReport(null);
        }}
        onSuccess={handleReportSuccess}
        editingReport={editingReport}
        families={families}
      />

      <CreateSmallFamilyModal
        isOpen={showCreateFamilyModal}
        onClose={() => setShowCreateFamilyModal(false)}
        onSuccess={handleCreateFamilySuccess}
      />

      <ViewSmallFamilyModal
        isOpen={showViewFamilyModal}
        onClose={() => {
          setShowViewFamilyModal(false);
          setSelectedFamily(null);
        }}
        family={selectedFamily}
      />

      <OccurrenceModal
        isOpen={showOccurrenceModal}
        onClose={() => setShowOccurrenceModal(false)}
        onSuccess={handleOccurrenceSuccess}
        ministryId="pequenas_familias"
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
