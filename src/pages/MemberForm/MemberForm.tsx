import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import type { MemberFormData, MemberResponse, ApiError } from '../../types';
import Button from '../../components/Button';
import './MemberForm.css';

const initialState: MemberFormData = {
  full_name: '',
  email: '',
  phone: '',
  birth_date: '',
  gender: '',
  address: '',
  house_number: '',
  complement: '',
  city: '',
  state: '',
  zip_code: '',
  baptism_date: '',
  membership_date: '',
  status: 'Ativo',
  notes: '',
};

export default function MemberForm() {
  const { user } = useAuth();
  const [form, setForm] = useState<MemberFormData>(initialState);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingCep, setLoadingCep] = useState<boolean>(false);
  const [addressFromCep, setAddressFromCep] = useState<boolean>(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Verificar permissão de edição
  useEffect(() => {
    if (isEditing && user?.role !== 'super_admin') {
      toast.error('Acesso negado. Apenas Super Admin pode editar membros.');
      navigate('/membros');
      return;
    }
  }, [isEditing, user, navigate]);

  useEffect(() => {
    if (isEditing) {
      loadMember();
    }
  }, [id]);

  async function loadMember(): Promise<void> {
    try {
      setLoadingData(true);
      const response = await api.get<MemberResponse>(`/members/${id}`);
      const member = response.data.member;

      setForm({
        full_name: member.full_name || '',
        email: member.email || '',
        phone: member.phone || '',
        birth_date: member.birth_date ? member.birth_date.split('T')[0] : '',
        gender: member.gender || '',
        address: member.address || '',
        house_number: member.house_number || '',
        complement: member.complement || '',
        city: member.city || '',
        state: member.state || '',
        zip_code: member.zip_code || '',
        baptism_date: member.baptism_date ? member.baptism_date.split('T')[0] : '',
        membership_date: member.membership_date ? member.membership_date.split('T')[0] : '',
        status: member.status || 'Ativo',
        notes: member.notes || '',
      });
    } catch (err) {
      toast.error('Erro ao carregar dados do membro.');
      navigate('/membros');
    } finally {
      setLoadingData(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void {
    const { name, value } = e.target;
    
    // Aplica máscara de CEP manualmente
    if (name === 'zip_code') {
      let maskedValue = value.replace(/\D/g, '');
      if (maskedValue.length > 5) {
        maskedValue = maskedValue.replace(/^(\d{5})(\d{3}).*/, '$1-$2');
      }
      setForm((prev) => ({ ...prev, [name]: maskedValue }));
      
      // Se tiver 8 dígitos, busca automática
      const cep = maskedValue.replace(/\D/g, '');
      if (cep.length === 8) {
        handleSearchCep(cep);
      }
    }
    // Aplica máscara de telefone
    else if (name === 'phone') {
      let maskedValue = value.replace(/\D/g, '');
      if (maskedValue.length > 0) {
        if (maskedValue.length <= 2) {
          maskedValue = `(${maskedValue}`;
        } else if (maskedValue.length <= 6) {
          maskedValue = `(${maskedValue.slice(0, 2)}) ${maskedValue.slice(2)}`;
        } else if (maskedValue.length <= 10) {
          maskedValue = `(${maskedValue.slice(0, 2)}) ${maskedValue.slice(2, 6)}-${maskedValue.slice(6)}`;
        } else {
          maskedValue = `(${maskedValue.slice(0, 2)}) ${maskedValue.slice(2, 7)}-${maskedValue.slice(7, 11)}`;
        }
      }
      setForm((prev) => ({ ...prev, [name]: maskedValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSearchCep(cep?: string): Promise<void> {
    const cepToSearch = cep || form.zip_code.replace(/\D/g, '');
    
    if (cepToSearch.length !== 8) {
      return;
    }

    setLoadingCep(true);
    
    try {
      const response = await api.get(`/cep/${cepToSearch}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setForm(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        
        // Marca que endereço foi preenchido pelo CEP
        if (data.logradouro || data.localidade || data.uf) {
          setAddressFromCep(true);
        }
        
        toast.success('Endereço encontrado e preenchido!');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || 'Erro ao buscar CEP.');
    } finally {
      setLoadingCep(false);
    }
  }

  function handleAddressFieldChange(e: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    
    // Se o usuário editar manualmente, permite edição dos campos
    if (['address', 'city', 'state'].includes(name)) {
      setAddressFromCep(false);
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validações de campos obrigatórios
    if (!form.full_name.trim()) {
      toast.warning('Nome completo é obrigatório.');
      return;
    }

    if (!form.phone.trim()) {
      toast.warning('Telefone é obrigatório.');
      return;
    }

    if (!form.birth_date) {
      toast.warning('Data de nascimento é obrigatória.');
      return;
    }

    if (!form.gender) {
      toast.warning('Gênero é obrigatório.');
      return;
    }

    if (!form.zip_code.trim()) {
      toast.warning('CEP é obrigatório.');
      return;
    }

    if (!form.address.trim()) {
      toast.warning('Endereço é obrigatório.');
      return;
    }

    if (!form.house_number.trim()) {
      toast.warning('Número é obrigatório.');
      return;
    }

    setLoading(true);

    // Preparar dados para envio (remover máscaras)
    const formData = {
      ...form,
      phone: form.phone.replace(/\D/g, ''), // Remove máscara do telefone
      zip_code: form.zip_code.replace(/\D/g, ''), // Remove máscara do CEP
    };

    try {
      if (isEditing) {
        await api.put(`/members/${id}`, formData);
        toast.success('Membro atualizado com sucesso!');
      } else {
        await api.post('/members', formData);
        toast.success('Membro cadastrado com sucesso!');
      }
      navigate('/membros');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || 'Erro ao salvar membro.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="member-form-page">
      <div className="member-form-card">
        <h2>{isEditing ? 'Editar Membro' : 'Cadastrar Novo Membro'}</h2>

        <form className="member-form" onSubmit={handleSubmit}>
          {/* Dados Pessoais */}
          <div className="form-section">
            <span className="form-section-title">Dados Pessoais</span>
            <div className="form-row">
              <div className="form-group-light">
                <label htmlFor="full_name">Nome completo<span className="required">*</span></label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Nome do membro"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-light">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group-light">
                <label htmlFor="phone">Telefone<span className="required">*</span></label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={15}
                  required
                />
              </div>
              <div className="form-group-light">
                <label htmlFor="birth_date">Data de Nascimento<span className="required">*</span></label>
                <input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={form.birth_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-light">
                <label htmlFor="gender">Gênero<span className="required">*</span></label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="form-section">
            <span className="form-section-title">Endereço</span>
            <div className="form-row">
              <div className="form-group-light">
                <label htmlFor="zip_code">CEP<span className="required">*</span></label>
                <div className="cep-input-container">
                  <input
                    id="zip_code"
                    name="zip_code"
                    type="text"
                    placeholder="00000-000"
                    value={form.zip_code}
                    onChange={handleChange}
                    maxLength={9}
                    required
                  />
                  {loadingCep && (
                    <div className="spinner-small"></div>
                  )}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group-light" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="address">Endereço<span className="required">*</span></label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Rua, Avenida, etc."
                  value={form.address}
                  onChange={handleAddressFieldChange}
                  disabled={addressFromCep}
                  required
                />
                {addressFromCep && (
                  <small className="field-hint">Preenchido automaticamente pelo CEP</small>
                )}
              </div>
              <div className="form-group-light">
                <label htmlFor="house_number">Número<span className="required">*</span></label>
                <input
                  id="house_number"
                  name="house_number"
                  type="text"
                  placeholder="123, apt 101, etc."
                  value={form.house_number}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-light">
                <label htmlFor="complement">Complemento</label>
                <input
                  id="complement"
                  name="complement"
                  type="text"
                  placeholder="Apto 101, Bloco B, Casa 2, etc."
                  value={form.complement}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group-light">
                <label htmlFor="city">Cidade</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Cidade"
                  value={form.city}
                  onChange={handleAddressFieldChange}
                  disabled={addressFromCep}
                />
                {addressFromCep && (
                  <small className="field-hint">Preenchido automaticamente pelo CEP</small>
                )}
              </div>
              <div className="form-group-light">
                <label htmlFor="state">Estado</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="UF"
                  maxLength={2}
                  value={form.state}
                  onChange={handleAddressFieldChange}
                  disabled={addressFromCep}
                />
                {addressFromCep && (
                  <small className="field-hint">Preenchido automaticamente pelo CEP</small>
                )}
              </div>
            </div>
          </div>

          {/* Dados da Igreja */}
          <div className="form-section">
            <span className="form-section-title">Dados da Igreja</span>
            <div className="form-row">
              <div className="form-group-light">
                <label htmlFor="baptism_date">Data de Batismo</label>
                <input
                  id="baptism_date"
                  name="baptism_date"
                  type="date"
                  value={form.baptism_date}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-light">
                <label htmlFor="membership_date">Data de Filiação</label>
                <input
                  id="membership_date"
                  name="membership_date"
                  type="date"
                  value={form.membership_date}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-light">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Visitante">Visitante</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="form-section">
            <span className="form-section-title">Observações</span>
            <div className="form-group-light">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Observações sobre o membro..."
                value={form.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              icon={<FiSave />}
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/membros')}
              icon={<FiArrowLeft />}
            >
              Voltar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
