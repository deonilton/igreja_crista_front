import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { FiSearch, FiX, FiUsers, FiUserPlus, FiTrash2, FiEdit2, FiCheck, FiAlertCircle, FiShield } from 'react-icons/fi';
import Swal from '../../utils/swalConfig';
import ministryLeadersService from '../../services/ministryLeadersService';
import type { Ministry, MinistryLeader, MinistryWithLeaders, MemberSearchResult } from '../../types/ministryLeaders';
import './MinistryLeadersManager.css';

const showToast = (type: 'success' | 'error', message: string) => {
  if (type === 'error') {
    void Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: message,
      confirmButtonText: 'Ok',
    });
    return;
  }
  void Swal.fire({
    icon: 'success',
    title: 'Sucesso!',
    text: message,
    timer: 3000,
    showConfirmButton: false,
  });
};

interface MinistryLeadersManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function MinistryLeadersManager({ isOpen, onClose }: MinistryLeadersManagerProps) {
  const [ministries, setMinistries] = useState<MinistryWithLeaders[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMinistry, setSelectedMinistry] = useState<MinistryWithLeaders | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [editingLeader, setEditingLeader] = useState<MinistryLeader | null>(null);
  const [selectedRole, setSelectedRole] = useState<'leader' | 'co_leader'>('leader');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Buscar membros para autocomplete
  const searchMembers = useCallback(debounce(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await ministryLeadersService.searchMembers(query.trim());
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, 300), []);

  // Carregar ministérios com líderes
  const loadMinistries = async () => {
    setLoading(true);
    try {
      const ministriesData = await ministryLeadersService.getMinistriesWithLeaders();
      setMinistries(ministriesData);
      
      // Atualizar o ministério selecionado se existir
      if (selectedMinistry) {
        const updated = ministriesData.find(m => m.id === selectedMinistry.id);
        if (updated) setSelectedMinistry(updated);
      }
    } catch (error) {
      console.error('Erro ao carregar ministérios:', error);
      showToast('error', 'Erro ao carregar líderes dosministérios');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar líder ao Ministério
  const handleAddLeader = async () => {
    if (!selectedMinistry || !selectedMember) {
      showToast('error','Selecione um ministério e um membro');
      return;
    }

    const leadersInRole = selectedMinistry.leaders.filter(l => l.role === selectedRole);
    if (leadersInRole.length >= 2) {
      showToast('error',`Este ministério já possui o máximo de 2 ${selectedRole === 'leader' ? 'líderes' : 'co-líderes'}`);
      return;
    }

    const totalLeaders = selectedMinistry.leaders.length;
    if (totalLeaders >= 4) {
      showToast('error','Este ministério já possui o máximo de 4 líderes (2 líderes + 2 co-líderes)');
      return;
    }

    const isAlreadyLeader = selectedMinistry.leaders.some(
      leader => leader.member_id === selectedMember.id
    );
    if (isAlreadyLeader) {
      showToast('error','Este membro já é líder deste ministério');
      return;
    }

    try {
      await ministryLeadersService.addLeader({
        ministry_id: selectedMinistry.name || selectedMinistry.id,
        member_id: selectedMember.id,
        role: selectedRole
      });
      
      showToast('success','Líder adicionado com sucesso!');
      resetForm();
      loadMinistries();
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage =
        error.response?.data?.error || error.response?.data?.message || '';

      if (status === 400 && errorMessage) {
        showToast('error', errorMessage);
        return;
      }

      if (status === 409) {
        if (errorMessage.includes('maximum number of leaders') || errorMessage.includes('maximum number')) {
          showToast('error','Este ministério já atingiu o limite de 2 líderes. Remova um líder existente antes de adicionar outro.');
        } else if (errorMessage.includes('already a leader') || errorMessage.includes('already is a leader')) {
          showToast('error','Este membro já é líder deste ministério.');
        } else {
          showToast('error',errorMessage || 'Não foi possível adicionar este líder.');
        }
      } else {
        showToast('error','Erro ao adicionar líder. Tente novamente.');
      }
    }
  };

  // Editar líder
  const handleEditLeader = (leader: MinistryLeader) => {
    setEditingLeader(leader);
    setSelectedMember({
      id: leader.member?.id || 0,
      full_name: leader.member?.full_name || '',
      email: leader.member?.email || null,
      phone: leader.member?.phone || null
    });
    setSearchQuery(leader.member?.full_name || '');
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!editingLeader || !selectedMember || !selectedMinistry) {
      showToast('error','Selecione um membro para atualizar');
      return;
    }

    const isAlreadyLeader = selectedMinistry.leaders.some(
      leader => leader.member_id === selectedMember.id && leader.id !== editingLeader.id
    );
    if (isAlreadyLeader) {
      showToast('error','Este membro já é líder deste ministério');
      return;
    }

    try {
      await ministryLeadersService.updateLeader(editingLeader.id, {
        member_id: selectedMember.id
      });
      
      showToast('success','Líder atualizado com sucesso!');
      resetForm();
      loadMinistries();
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage =
        error.response?.data?.error || error.response?.data?.message || '';

      if (status === 400 && errorMessage) {
        showToast('error', errorMessage);
        return;
      }

      if (status === 409) {
        if (errorMessage.includes('maximum number of leaders') || errorMessage.includes('maximum number')) {
          showToast('error','Este ministério já atingiu o limite de 2 líderes. Não é possível alterar para este membro.');
        } else if (errorMessage.includes('already a leader') || errorMessage.includes('already is a leader')) {
          showToast('error','Este membro já é líder deste ministério.');
        } else {
          showToast('error',errorMessage || 'Não foi possível atualizar este líder.');
        }
      } else {
        showToast('error','Erro ao atualizar líder. Tente novamente.');
      }
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setEditingLeader(null);
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedRole('leader');
  };

  // Remover líder
  const handleRemoveLeader = async (leaderId: number, leaderName: string) => {
    const result = await Swal.fire({
      title: 'Remover líder?',
      text: `Deseja remover "${leaderName}" da liderança?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await ministryLeadersService.removeLeader(leaderId);
      showToast('success','Líder removido com sucesso!');
      loadMinistries();
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (error instanceof Error ? error.message : '');
      showToast('error', msg || 'Erro ao remover líder');
    }
  };

  // Selecionar membro da busca
  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setSearchQuery(member.full_name);
    setShowSearchResults(false);
  };

  // Selecionar ministério
  const handleSelectMinistry = (ministry: MinistryWithLeaders) => {
    setSelectedMinistry(ministry);
    resetForm();
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

  // Busca de membros
  useEffect(() => {
    searchMembers(searchQuery);
  }, [searchQuery]);

  // Carregar dados ao abrir
  useEffect(() => {
    if (isOpen) {
      loadMinistries();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mlm-overlay" onClick={onClose}>
      <div className="mlm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mlm-header">
          <h2><FiUsers /> Gerenciar Líderes de Ministérios</h2>
          <button className="mlm-close" onClick={onClose}><FiX /></button>
        </div>

        {/* Body */}
        <div className="mlm-body">
          {/* Sidebar - Lista de ministérios */}
          <aside className="mlm-sidebar">
            <h3>Ministérios</h3>
            <div className="mlm-ministry-list">
              {ministries.map(ministry => (
                <button
                  key={ministry.id}
                  className={`mlm-ministry-item ${selectedMinistry?.id === ministry.id ? 'active' : ''}`}
                  onClick={() => handleSelectMinistry(ministry)}
                >
                  <div className="mlm-ministry-item-top">
                    <span className="mlm-ministry-name">{getDisplayName(ministry)}</span>
                    <span className={`mlm-badge ${ministry.leaders.length > 0 ? 'has-leaders' : ''}`}>
                      {ministry.leaders.length}/4
                    </span>
                  </div>
                  {ministry.leaders.length > 0 ? (
                    <div className="mlm-ministry-leaders-preview">
                      {ministry.leaders.map(l => (
                        <span key={l.id}>{l.member?.full_name}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="mlm-no-leaders-text">Sem líderes definidos</span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Conteúdo principal */}
          <main className="mlm-content">
            {!selectedMinistry ? (
              <div className="mlm-empty-state">
                <FiUsers size={48} />
                <h3>Selecione um ministério</h3>
                <p>Escolha um ministério na lista ao lado para gerenciar seus líderes.</p>
              </div>
            ) : (
              <>
                <div className="mlm-content-header">
                  <h3>Líderes de {getDisplayName(selectedMinistry)}</h3>
                  {selectedMinistry.leaders.length >= 2 && (
                    <span className="mlm-limit-badge">
                      <FiAlertCircle size={14} />
                      Limite atingido
                    </span>
                  )}
                </div>

                {/* Líderes atuais */}
                <div className="mlm-leaders-section">
                  {selectedMinistry.leaders.length > 0 ? (
                    <div className="mlm-leaders-list">
                      {selectedMinistry.leaders.map(leader => (
                        <div key={leader.id} className="mlm-leader-card">
                          <div className="mlm-leader-avatar">
                            {leader.member?.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="mlm-leader-details">
                            <strong>{leader.member?.full_name}</strong>
                            {leader.member?.email && <span>{leader.member.email}</span>}
                          </div>
                          <div className="mlm-leader-actions">
                            <button onClick={() => handleEditLeader(leader)} title="Editar">
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              className="danger"
                              onClick={() => handleRemoveLeader(leader.id, leader.member?.full_name || '')}
                              title="Remover"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mlm-no-leaders">
                      <FiUsers size={32} />
                      <p>Nenhum líder definido para este ministério</p>
                    </div>
                  )}
                </div>

                {/* Formulário adicionar/editar */}
                {selectedMinistry.leaders.length < 4 ? (
                  <div className="mlm-form-section">
                    <h4>{editingLeader ? 'Editar Líder' : 'Adicionar Novo Líder'}</h4>

                    {/* Membro selecionado */}
                    {selectedMember ? (
                      <div className="mlm-selected-member">
                        <div className="mlm-selected-avatar">
                          {selectedMember.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="mlm-selected-info">
                          <strong>{selectedMember.full_name}</strong>
                          {selectedMember.email && <span>{selectedMember.email}</span>}
                        </div>
                        <button className="mlm-clear-member" onClick={resetForm}>
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="mlm-search-wrapper" ref={searchRef}>
                        <div className="mlm-search-field">
                          <FiSearch className="mlm-search-icon" />
                          <input
                            type="text"
                            placeholder="Buscar membro por nome ou email..."
                            value={searchQuery}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                            <button className="mlm-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}>
                              <FiX size={14} />
                            </button>
                          )}
                        </div>

                        {showSearchResults && (
                          <div className="mlm-search-dropdown">
                            {searchLoading ? (
                              <div className="mlm-search-status">Buscando...</div>
                            ) : searchResults.length > 0 ? (
                              searchResults.map(member => (
                                <button
                                  key={member.id}
                                  className="mlm-search-item"
                                  onClick={() => handleSelectMember(member)}
                                >
                                  <div className="mlm-search-item-avatar">
                                    {member.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="mlm-search-item-info">
                                    <strong>{member.full_name}</strong>
                                    {member.email && <span>{member.email}</span>}
                                  </div>
                                </button>
                              ))
                            ) : searchQuery.length >= 2 ? (
                              <div className="mlm-search-status">Nenhum membro encontrado</div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Seleção de Cargo */}
                    {!editingLeader && (
                      <div className="mlm-role-selector">
                        <label>Selecione o cargo:</label>
                        <div className="mlm-role-buttons">
                          {(() => {
                            const leaderCount = selectedMinistry.leaders.filter(l => l.role === 'leader').length;
                            const coLeaderCount = selectedMinistry.leaders.filter(l => l.role === 'co_leader').length;
                            const totalCount = selectedMinistry.leaders.length;
                            
                            return (
                              <>
                                <button
                                  type="button"
                                  className={`mlm-role-btn ${selectedRole === 'leader' ? 'active' : ''}`}
                                  onClick={() => setSelectedRole('leader')}
                                  disabled={leaderCount >= 2 || totalCount >= 4}
                                >
                                  <FiShield size={16} />
                                  Líder ({leaderCount}/2)
                                  {leaderCount >= 2 && <span className="mlm-role-occupied">Lotado</span>}
                                </button>
                                <button
                                  type="button"
                                  className={`mlm-role-btn ${selectedRole === 'co_leader' ? 'active' : ''}`}
                                  onClick={() => setSelectedRole('co_leader')}
                                  disabled={coLeaderCount >= 2 || totalCount >= 4}
                                >
                                  <FiShield size={16} />
                                  Co-Líder ({coLeaderCount}/2)
                                  {coLeaderCount >= 2 && <span className="mlm-role-occupied">Lotado</span>}
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Botões */}
                    <div className="mlm-form-actions">
                      {editingLeader ? (
                        <>
                          <button className="mlm-btn primary" onClick={handleSaveEdit} disabled={!selectedMember}>
                            <FiCheck size={16} /> Salvar
                          </button>
                          <button className="mlm-btn secondary" onClick={resetForm}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button className="mlm-btn primary" onClick={handleAddLeader} disabled={!selectedMember}>
                          <FiUserPlus size={16} /> Adicionar {selectedRole === 'leader' ? 'Líder' : 'Co-Líder'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mlm-form-section">
                    <div className="mlm-full-ministry">
                      <FiAlertCircle size={24} />
                      <div>
                        <h4>Ministério com limite atingido</h4>
                        <p>Este ministry já tem {selectedMinistry.leaders.length} líderes. O limite máximo é 4 líderes (2 líderes + 2 co-líderes).</p>
                        <p>Para adicionar um novo líder, remova um dos líderes existentes.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
