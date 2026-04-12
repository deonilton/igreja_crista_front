import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { FiPlus, FiTrash2, FiUsers, FiX, FiSearch, FiUser, FiUserCheck, FiFileText, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Swal, { showSuccess, showError, showWarning } from '../../utils/swalConfig';
import api from '../../services/api';
import type { Deacon, DeaconsResponse, MemberSearchResult } from '../../types/deacons';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button/Button';
import MinistryLeaders from '../../components/MinistryLeaders/MinistryLeaders';
import OccurrenceModal from './OccurrenceModal';
import CultReportModal from './CultReportModal';
import './Diaconia.css';

export default function Diaconia() {
  const [deacons, setDeacons] = useState<Deacon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  
  // Estados para estatísticas
  const [statistics, setStatistics] = useState<{ total: number, men: number, women: number }>({
    total: 0,
    men: 0,
    women: 0
  });
  const [statisticsLoading, setStatisticsLoading] = useState<boolean>(true);
  
  // Estados para busca de membros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  
  // Estados para edição
  const [editingDeacon, setEditingDeacon] = useState<Deacon | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  
  // Estados para sistema de abas
  const [activeTab, setActiveTab] = useState<'relatorio' | 'ocorrencias' | 'eventos'>('relatorio');
  
  // Estados para modal de ocorrências
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<any>(null);
  
  // Estados para lista de ocorrências
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [occurrencesLoading, setOccurrencesLoading] = useState(false);
  
  // Estados para modal de relatório de culto
  const [showCultReportModal, setShowCultReportModal] = useState(false);
  const [editingCultReport, setEditingCultReport] = useState<any>(null);
  const [cultReports, setCultReports] = useState<any[]>([]);
  const [cultReportsLoading, setCultReportsLoading] = useState(false);
  const [cultReportsPage, setCultReportsPage] = useState(1);
  const [cultReportsTotalPages, setCultReportsTotalPages] = useState(1);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const limit = 10;

  // Função debounce para busca
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

  // Buscar membros para autocomplete
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

  // Carregar estatísticas
  const loadStatistics = () => {
    setStatisticsLoading(true);
    api.get<{ total: number, men: number, women: number }>('/deacons/statistics')
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

  // Carregar diáconos
  const loadDeacons = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    params.page = currentPage.toString();
    params.limit = limit.toString();

    api.get<DeaconsResponse>('/deacons', { params })
      .then(response => {
        setDeacons(response.data.deacons);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      })
      .catch(err => {
        void showError('Erro ao carregar diáconos.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Adicionar diácono
  const handleAddDeacon = async () => {
    if (!selectedMember) {
      void showError('Selecione um membro para adicionar como diácono.');
      return;
    }

    try {
      await api.post('/deacons', { member_id: selectedMember.id });
      await showSuccess('Diácono adicionado com sucesso!');
      setSelectedMember(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      loadStatistics();
      loadDeacons();
    } catch (error: any) {
      if (error.response?.status === 409) {
        await showWarning('Este membro já é um diácono.', 'Atenção!');
        setSelectedMember(null);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
      } else if (error.response?.status === 404) {
        void showError('Membro não encontrado.');
      } else {
        void showError('Erro ao adicionar diácono.');
      }
    }
  };

  // Editar diácono
  const handleEditDeacon = (deacon: Deacon) => {
    setEditingDeacon(deacon);
    setSelectedMember({
      id: deacon.member?.id || 0,
      full_name: deacon.member?.full_name || '',
      email: deacon.member?.email || null,
      phone: deacon.member?.phone || null
    });
    setSearchQuery(deacon.member?.full_name || '');
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!editingDeacon || !selectedMember) {
      void showError('Selecione um membro para atualizar.');
      return;
    }

    try {
      await api.put(`/deacons/${editingDeacon.id}`, { member_id: selectedMember.id });
      await showSuccess('Diácono atualizado com sucesso!');
      setEditingDeacon(null);
      setSelectedMember(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      loadDeacons();
    } catch (error: any) {
      if (error.response?.status === 409) {
        void showWarning('Este membro já é um diácono.', 'Atenção!');
      } else if (error.response?.status === 404) {
        void showError('Membro não encontrado.');
      } else {
        void showError('Erro ao atualizar diácono.');
      }
    }
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingDeacon(null);
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Excluir diácono
  const handleDeleteDeacon = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Tem certeza que deseja remover este diácono?',
      text: `Você está removendo "${name}" da diaconia.`,
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
      await api.delete(`/deacons/${id}`);
      await showSuccess('Diácono removido com sucesso!');
      loadStatistics();
      loadDeacons();
    } catch (error) {
      void showError('Erro ao remover diácono.');
    }
  };

  // Selecionar membro da busca
  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setSearchQuery(member.full_name);
    setShowSearchResults(false);
  };

  // Mudar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadDeacons();
  };

  // Funções para modal de ocorrências
  const handleOpenOccurrenceModal = (occurrence?: any) => {
    setEditingOccurrence(occurrence || null);
    setShowOccurrenceModal(true);
  };

  const handleCloseOccurrenceModal = () => {
    setShowOccurrenceModal(false);
    setEditingOccurrence(null);
  };

  const handleOccurrenceSuccess = () => {
    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: 'Ocorrência registrada com sucesso!',
      background: '#f9fafb',
      confirmButtonColor: '#3b82f6'
    });
    loadOccurrences();
  };

  
  // Carregar ocorrências
  const loadOccurrences = async () => {
    setOccurrencesLoading(true);
    try {
      const response = await api.get('/occurrences?ministry_id=diaconia');
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

  
  // Carregar relatórios de culto
  const loadCultReports = async (page: number = 1) => {
    setCultReportsLoading(true);
    try {
      const response = await api.get(`/cult-reports?page=${page}&limit=10`);
      setCultReports(response.data.reports || []);
      setCultReportsTotalPages(response.data.totalPages || 1);
      setCultReportsPage(page);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'Erro ao carregar relatórios de culto',
        background: '#f9fafb',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setCultReportsLoading(false);
    }
  };

  // Funções para modal de relatório de culto
  const handleOpenCultReportModal = () => {
    setEditingCultReport(null);
    setShowCultReportModal(true);
  };

  const handleCloseCultReportModal = () => {
    setShowCultReportModal(false);
    setEditingCultReport(null);
  };

  const handleCultReportSuccess = () => {
    loadCultReports(cultReportsPage);
  };

  const handleEditCultReport = (report: any) => {
    setEditingCultReport(report);
    setShowCultReportModal(true);
  };

  const handleDeleteCultReport = async (id: number) => {
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
        await api.delete(`/cult-reports/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: 'Relatório excluído com sucesso!',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
        loadCultReports(cultReportsPage);
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

  const handleDeleteOccurrence = async (id: number) => {
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
        await api.delete(`/occurrences/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: 'Ocorrência excluída com sucesso!',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
        loadOccurrences();
      } catch (error) {
        console.error('Erro ao excluir ocorrência:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: 'Erro ao excluir ocorrência',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  
  // Fechar busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregamento inicial
  useEffect(() => {
    loadDeacons();
    loadStatistics();
  }, [currentPage]);

  // Carregar relatórios quando a aba for acessada
  useEffect(() => {
    if (activeTab === 'relatorio') {
      loadCultReports();
    } else if (activeTab === 'ocorrencias') {
      loadOccurrences();
    }
  }, [activeTab]);

  // Busca de membros
  useEffect(() => {
    searchMembers(searchQuery);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        Carregando diáconos...
      </div>
    );
  }

  return (
    <div className="diaconia-page">
      {/* Card de Líderes de Ministérios */}
      <div className="diaconia-ministry-leaders-card">
        <MinistryLeaders ministryId="diaconia" showTitle={true} />
      </div>

      {/* Card de Estatísticas */}
      <div className="diaconia-stats-card">
        <h3>Irmãos(ãs) Membros da Diaconia - ICF Aparecida</h3>
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

      {/* Sistema de Abas */}
      <div className="diaconia-tabs-card">
        <h3>Ações Rápidas</h3>
        <div className="tabs-container">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'relatorio' ? 'active' : ''}`}
              onClick={() => setActiveTab('relatorio')}
            >
              <FiFileText />
              Relatório de Culto
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
                    <h3>Relatórios de Culto</h3>
                    <button className="btn btn-primary" onClick={() => handleOpenCultReportModal()}>
                      <FiPlus />
                      Novo Relatório
                    </button>
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
                              <th>Ministro da Palavra</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cultReports.map((report) => (
                              <tr 
                                key={report.id}
                                className="clickable-row"
                                onClick={() => handleEditCultReport(report)}
                              >
                                <td>
                                  <div className="table-date">
                                    <FiCalendar />
                                    {new Date(report.cult_date).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td>{report.ministro}</td>
                                <td>
                                  <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      className="btn-action btn-edit" 
                                      onClick={() => handleEditCultReport(report)}
                                    >
                                      <FiUser />
                                      Editar
                                    </button>
                                    <button 
                                      className="btn-action btn-delete" 
                                      onClick={() => handleDeleteCultReport(report.id)}
                                    >
                                      <FiTrash2 />
                                      Excluir
                                    </button>
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
                          onPageChange={(page) => loadCultReports(page)}
                        />
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <FiFileText />
                      <h3>Nenhum relatório encontrado</h3>
                      <p>Clique em "Novo Relatório" para criar o primeiro relatório de culto.</p>
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
                    <button className="btn btn-primary" onClick={() => handleOpenOccurrenceModal()}>
                      <FiPlus />
                      Nova Ocorrência
                    </button>
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
                              <tr 
                                key={occurrence.id}
                                className="clickable-row"
                                onClick={() => handleOpenOccurrenceModal(occurrence)}
                              >
                                <td>
                                  <div className="table-date">
                                    <FiCalendar />
                                    {new Date(occurrence.date).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td>{occurrence.reporter_name}</td>
                                <td>{occurrence.location}</td>
                                <td>
                                  <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      className="btn-action btn-edit" 
                                      onClick={() => handleOpenOccurrenceModal(occurrence)}
                                    >
                                      <FiUser />
                                      Ver
                                    </button>
                                    <button 
                                      className="btn-action btn-delete" 
                                      onClick={() => handleDeleteOccurrence(occurrence.id)}
                                    >
                                      <FiTrash2 />
                                      Excluir
                                    </button>
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
                      <p>Clique em "Nova Ocorrência" para registrar a primeira ocorrência.</p>
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
        <h1>Diaconia</h1>
        <p>Gestão de diáconos da igreja</p>
      </div>

      {/* Formulário de adição/edição */}
      <div className="diaconia-form-card">
        <h3>{editingDeacon ? 'Editar Diácono' : 'Adicionar Diácono'}</h3>
        
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
              {searchQuery && !editingDeacon && (
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
            
            {editingDeacon ? (
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
                onClick={handleAddDeacon}
                disabled={!selectedMember}
                icon={<FiPlus />}
              >
                Adicionar Diácono
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

      {/* Lista de diáconos */}
      <div className="diaconia-list-card">
        <h3>Diáconos ({total})</h3>
        
        {deacons.length > 0 ? (
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
                {deacons.map(deacon => (
                  <tr key={deacon.id}>
                    <td>
                      <div className="deacon-name">{deacon.member?.full_name}</div>
                    </td>
                    <td>
                      {deacon.member?.email || '—'}
                    </td>
                    <td>{formatPhone(deacon.member?.phone || null)}</td>
                    <td>
                      {new Date(deacon.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className="deacon-actions">
                        <button
                          className="btn-icon danger"
                          title="Remover"
                          onClick={() => handleDeleteDeacon(deacon.id, deacon.member?.full_name || '')}
                        >
                          <FiTrash2 />
                        </button>
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
            <h3>Nenhum diácono encontrado</h3>
            <p>Adicione o primeiro diácono usando o formulário acima.</p>
          </div>
        )}
      </div>

      {/* Modal de Ocorrências */}
      <OccurrenceModal
        isOpen={showOccurrenceModal}
        onClose={handleCloseOccurrenceModal}
        onSuccess={handleOccurrenceSuccess}
        editingOccurrence={editingOccurrence}
        ministryId="diaconia"
      />

      
      {/* Modal de Relatório de Culto */}
      <CultReportModal
        isOpen={showCultReportModal}
        onClose={handleCloseCultReportModal}
        onSuccess={handleCultReportSuccess}
        editingReport={editingCultReport}
      />
    </div>
  );
}
