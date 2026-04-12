import { FormEvent, useState, useEffect, useRef } from 'react';
import { FiEye, FiEyeOff, FiSearch, FiUser, FiX } from 'react-icons/fi';
import { showSuccess, showError } from '../../utils/swalConfig';
import api from '../../services/api';
import type { Member } from '../../types';
import Modal from '../../components/Modal';
import Button from '../../components/Button/Button';
import './UserModal.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'colaborador';
  ministries: string[];
}

interface UserModalProps {
  user: User | null;
  /** Lista atual para detectar e-mail já cadastrado e atualizar em vez de criar duplicata. */
  existingUsers?: User[];
  onClose: () => void;
}

function normalizeEmail(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase();
}

export default function UserModal({ user, existingUsers = [], onClose }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Quando "Novo usuário" mas o e-mail já existe: gravamos com PUT neste id. */
  const [matchedExistingUser, setMatchedExistingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'colaborador' as 'super_admin' | 'admin' | 'colaborador',
    ministries: [] as string[],
  });

  const availableMinistries = [
    { id: 'pequenas_familias', label: 'Pequenas Famílias' },
    { id: 'evangelismo', label: 'Evangelismo e Missões' },
    { id: 'diaconia', label: 'Diaconia' },
    { id: 'louvor', label: 'Louvor' },
    { id: 'ministerio_infantil', label: 'Ministério Infantil' },
    { id: 'membros', label: 'Membros da ICF' },
  ];

  useEffect(() => {
    if (user) {
      setMatchedExistingUser(null);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        ministries: user.ministries || [],
      });
    }
  }, [user]);

  // E-mail digitado manualmente (sem buscar membro): detecta usuário existente para permitir novos ministérios
  useEffect(() => {
    if (user || selectedMember) {
      return;
    }
    const handle = setTimeout(() => {
      const email = normalizeEmail(formData.email);
      if (!email || email.length < 3 || !existingUsers.length) {
        setMatchedExistingUser(null);
        return;
      }
      const match = existingUsers.find((u) => normalizeEmail(u.email) === email) || null;
      setMatchedExistingUser(match);
      if (match) {
        setFormData((fd) => ({
          ...fd,
          name: match.name,
          role: match.role,
          ministries: [...(match.ministries || [])],
        }));
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [formData.email, existingUsers, user, selectedMember]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search members with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (memberSearch.trim().length >= 2) {
      setSearchLoading(true);
      debounceRef.current = setTimeout(() => {
        searchMembers(memberSearch);
      }, 300);
    } else {
      setSearchResults([]);
      setShowMemberDropdown(false);
      setSearchLoading(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [memberSearch]);

  async function searchMembers(query: string) {
    try {
      const response = await api.get('/members', {
        params: {
          search: query,
          limit: 5,
          status: 'Ativo' // Only search for active members
        }
      });
      setSearchResults(response.data.members);
      setShowMemberDropdown(true);
    } catch (error) {
      console.error('Error searching members:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleMemberSelect(member: Member) {
    setSelectedMember(member);
    const email = member.email || '';
    const match =
      email && existingUsers.length
        ? existingUsers.find((u) => normalizeEmail(u.email) === normalizeEmail(email)) || null
        : null;
    setMatchedExistingUser(match);
    setFormData((prev) => ({
      ...prev,
      name: member.full_name,
      email,
      ...(match
        ? {
            role: match.role,
            ministries: [...(match.ministries || [])],
            password: '',
          }
        : {}),
    }));
    setMemberSearch('');
    setSearchResults([]);
    setShowMemberDropdown(false);
  }

  function clearSelectedMember() {
    setSelectedMember(null);
    setMatchedExistingUser(null);
    setFormData((prev) => ({
      ...prev,
      name: '',
      email: '',
    }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleMinistryToggle(ministryId: string) {
    setFormData(prev => ({
      ...prev,
      ministries: prev.ministries.includes(ministryId)
        ? prev.ministries.filter(m => m !== ministryId)
        : [...prev.ministries, ministryId]
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const updateUserId = user?.id ?? matchedExistingUser?.id;

    try {
      if (updateUserId) {
        await api.put(`/users/${updateUserId}`, formData);
        showSuccess(
          user
            ? 'Usuário atualizado com sucesso!'
            : 'Usuário já existia: ministérios e permissões foram atualizados.'
        );
      } else {
        if (!formData.password || formData.password.length < 6) {
          showError('Senha deve ter no mínimo 6 caracteres');
          setLoading(false);
          return;
        }
        await api.post('/users', formData);
        showSuccess('Usuário cadastrado com sucesso!');
      }
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <button type="button" className="btn btn-secondary btn-md" onClick={onClose}>
        Cancelar
      </button>
      <button type="submit" form="user-form" className="btn btn-primary btn-md" disabled={loading}>
        {loading
          ? 'Salvando...'
          : user || matchedExistingUser
            ? 'Atualizar'
            : 'Cadastrar'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        user ? 'Editar Usuário' : matchedExistingUser ? 'Atualizar usuário existente' : 'Novo Usuário'
      }
      footer={footer}
      maxWidth="700px"
    >
      <form id="user-form" className="user-modal-form" onSubmit={handleSubmit}>
          {!user && matchedExistingUser && (
            <div className="user-modal-existing-banner" role="status">
              <p>
                Este e-mail já possui usuário no sistema. Marque os ministérios adicionais (ou ajuste o
                perfil) e salve para <strong>atualizar</strong> o cadastro — não será criada uma conta
                duplicada.
              </p>
            </div>
          )}

          {!user && (
            <div className="form-group">
              <label>Buscar Membro Existente</label>
              <div className="member-search-wrapper" ref={searchRef}>
                <div className="member-search-input-wrapper">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    className="form-input member-search-input"
                    placeholder="Buscar por nome ou email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onFocus={() => memberSearch.trim().length >= 2 && setShowMemberDropdown(true)}
                  />
                  {searchLoading && <div className="search-spinner"></div>}
                </div>

                {selectedMember && (
                  <div className="selected-member">
                    <div className="selected-member-info">
                      <FiUser />
                      <div>
                        <div className="selected-member-name">{selectedMember.full_name}</div>
                        {selectedMember.email && (
                          <div className="selected-member-email">{selectedMember.email}</div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="clear-selected-member"
                      onClick={clearSelectedMember}
                      title="Limpar membro selecionado"
                    >
                      <FiX />
                    </button>
                  </div>
                )}

                {showMemberDropdown && searchResults.length > 0 && (
                  <div className="member-search-dropdown">
                    {searchResults.map((member) => (
                      <div
                        key={member.id}
                        className="member-search-result"
                        onClick={() => handleMemberSelect(member)}
                      >
                        <div className="member-result-info">
                          <div className="member-result-name">{member.full_name}</div>
                          {member.email && (
                            <div className="member-result-email">{member.email}</div>
                          )}
                          <div className="member-result-status">{member.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showMemberDropdown && !searchLoading && searchResults.length === 0 && memberSearch.trim().length >= 2 && (
                  <div className="member-search-dropdown">
                    <div className="no-results">Nenhum membro encontrado</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nome Completo *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={!!selectedMember}
            />
            {selectedMember && (
              <small className="form-help">Preenchido automaticamente pelo membro selecionado</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!selectedMember}
            />
            {selectedMember && (
              <small className="form-help">Preenchido automaticamente pelo membro selecionado</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {user || matchedExistingUser
                ? 'Nova Senha (deixe em branco para não alterar)'
                : 'Senha *'}
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder={
                  user || matchedExistingUser
                    ? 'Deixe em branco para manter a atual'
                    : 'Mínimo 6 caracteres'
                }
                value={formData.password}
                onChange={handleChange}
                required={!user && !matchedExistingUser}
                minLength={user || matchedExistingUser ? 0 : 6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Tipo de Acesso *</label>
            <select
              id="role"
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="super_admin">Super Admin (Acesso Total)</option>
              <option value="admin">Admin (Acesso a Ministérios Selecionados)</option>
              <option value="colaborador">Colaborador (Acesso Limitado)</option>
            </select>
          </div>

          {(formData.role === 'admin' || formData.role === 'colaborador') && (
            <div className="form-group">
              <label>Ministérios com Acesso</label>
              <div className="ministries-checkboxes">
                {availableMinistries.map(ministry => (
                  <label key={ministry.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.ministries.includes(ministry.id)}
                      onChange={() => handleMinistryToggle(ministry.id)}
                    />
                    <span>{ministry.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

      </form>
    </Modal>
  );
}
