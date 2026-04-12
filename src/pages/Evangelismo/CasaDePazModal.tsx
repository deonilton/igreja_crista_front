import { useState, useEffect, useRef, FormEvent } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { showSuccess, showError, showWarning } from '../../utils/swalConfig';
import api from '../../services/api';
import Modal from '../../components/Modal';
import type { CasaDePazFormData, FamilyMember, Leader, FullCasaDePaz } from '../../types/casaDePaz';
import './CasaDePazModal.css';

interface CasaDePazModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCasa?: FullCasaDePaz | null;
}

const casaToFormData = (casa: FullCasaDePaz): CasaDePazFormData => ({
  name: casa.name,
  responsible_id: casa.responsible_id,
  cep: String(casa.cep ?? '').replace(/\D/g, ''),
  street: casa.street ?? '',
  number: casa.number ?? '',
  complement: casa.complement ?? '',
  neighborhood: casa.neighborhood ?? '',
  city: casa.city ?? '',
  state: casa.state ?? '',
  host_name: casa.host_name,
  host_age: casa.host_age,
  family_members: (casa.family_members ?? []).map((m) => ({ name: m.name, age: m.age })),
  is_converted: Boolean(casa.is_converted),
  has_bible: Boolean(casa.has_bible),
  meeting_days: [...(casa.meeting_days ?? [])],
});

const defaultFormData = (): CasaDePazFormData => ({
  name: '',
  responsible_id: null,
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  host_name: '',
  host_age: null,
  family_members: [],
  is_converted: false,
  has_bible: false,
  meeting_days: [],
});

/** Exibe CEP como 00000-000; o estado guarda só dígitos (até 8). */
function formatCepMask(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

const weekDays = [
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
];

export default function CasaDePazModal({
  isOpen,
  onClose,
  onSuccess,
  editingCasa = null,
}: CasaDePazModalProps) {
  const [formData, setFormData] = useState<CasaDePazFormData>(defaultFormData());
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadLeaders();
    if (editingCasa) {
      setFormData(casaToFormData(editingCasa));
    } else {
      setFormData(defaultFormData());
    }
  }, [isOpen, editingCasa]);

  const loadLeaders = async () => {
    setLeadersLoading(true);
    try {
      const response = await api.get('/evangelismo/leaders', {
        params: { page: 1, limit: 100 },
      });
      setLeaders(response.data.casas || []);
    } catch (error) {
      console.error('Erro ao carregar líderes:', error);
    } finally {
      setLeadersLoading(false);
    }
  };

  const handleChange = (field: keyof CasaDePazFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (raw: string) => {
    const cleanedCep = raw.replace(/\D/g, '').slice(0, 8);
    setFormData(prev => ({ ...prev, cep: cleanedCep }));

    if (cleanedCep.length !== 8) {
      return;
    }

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          cep: cleanedCep,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }));
        setTimeout(() => numberInputRef.current?.focus(), 0);
      } else {
        showWarning('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      showError('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  const handleAddFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      family_members: [...prev.family_members, { name: '', age: 0 }],
    }));
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      family_members: prev.family_members.filter((_, i) => i !== index),
    }));
  };

  const handleFamilyMemberChange = (index: number, field: keyof FamilyMember, value: any) => {
    setFormData(prev => ({
      ...prev,
      family_members: prev.family_members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const handleMeetingDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      meeting_days: prev.meeting_days.includes(day)
        ? prev.meeting_days.filter(d => d !== day)
        : [...prev.meeting_days, day],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showWarning('Informe o nome da Casa de Paz');
      return false;
    }
    if (!formData.responsible_id) {
      showWarning('Selecione o responsável pela Casa de Paz');
      return false;
    }
    if (!formData.cep.trim()) {
      showWarning('Informe o CEP');
      return false;
    }
    if (!formData.host_name.trim()) {
      showWarning('Informe o nome do anfitrião');
      return false;
    }
    if (!formData.host_age || formData.host_age <= 0) {
      showWarning('Informe a idade do anfitrião');
      return false;
    }
    if (formData.meeting_days.length === 0) {
      showWarning('Selecione pelo menos um dia de reunião');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingCasa) {
        await api.put(`/evangelismo/casas-de-paz/${editingCasa.id}`, formData);
        showSuccess('Casa de Paz atualizada com sucesso!');
      } else {
        await api.post('/evangelismo/casas-de-paz', formData);
        showSuccess('Casa de Paz criada com sucesso!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar Casa de Paz:', error);
      showError(
        error.response?.data?.error ||
          (editingCasa ? 'Erro ao atualizar Casa de Paz' : 'Erro ao criar Casa de Paz')
      );
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-secondary btn-md" onClick={onClose} disabled={loading}>
        Cancelar
      </button>
      <button type="submit" form="casa-de-paz-form" className="btn btn-primary btn-md" disabled={loading}>
        {loading ? 'Salvando...' : editingCasa ? 'Salvar alterações' : 'Criar Casa de Paz'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCasa ? 'Editar Casa de Paz' : 'Criar Casa de Paz'}
      subtitle={editingCasa ? 'Altere os dados da Casa de Paz' : 'Cadastro de nova Casa de Paz'}
      footer={footer}
      maxWidth="900px"
    >
      <form id="casa-de-paz-form" className="create-family-form" onSubmit={handleSubmit}>
        {/* Informações Principais */}
        <div className="form-section">
          <h4 className="section-title">Informações Principais</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Nome da Casa de Paz *</label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Casa de Paz do Bairro Centro"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="responsible">Responsável pela Casa de Paz *</label>
              <select
                id="responsible"
                className="form-input"
                value={formData.responsible_id || ''}
                onChange={(e) => handleChange('responsible_id', Number(e.target.value))}
                required
                disabled={leadersLoading}
              >
                <option value="">Selecione um líder</option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.member_id}>
                    {leader.member?.full_name}
                  </option>
                ))}
              </select>
              {leadersLoading && <small className="form-help">Carregando líderes...</small>}
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="form-section">
          <h4 className="section-title">Endereço</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cep">CEP *</label>
              <input
                id="cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                className="form-input"
                value={formatCepMask(formData.cep)}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                required
              />
              {cepLoading && <small className="form-help">Buscando endereço...</small>}
            </div>
            
            <div className="form-group">
              <label htmlFor="number">Número *</label>
              <input
                id="number"
                ref={numberInputRef}
                type="text"
                className="form-input"
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="123"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="street">Rua</label>
              <input
                id="street"
                type="text"
                className="form-input"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Nome da rua"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="complement">Complemento</label>
              <input
                id="complement"
                type="text"
                className="form-input"
                value={formData.complement}
                onChange={(e) => handleChange('complement', e.target.value)}
                placeholder="Apto, bloco, etc"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="neighborhood">Bairro</label>
              <input
                id="neighborhood"
                type="text"
                className="form-input"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Cidade</label>
              <input
                id="city"
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Nome da cidade"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="state">Estado</label>
              <input
                id="state"
                type="text"
                className="form-input"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Família */}
        <div className="form-section">
          <h4 className="section-title">Família</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="host_name">Nome do Anfitrião *</label>
              <input
                id="host_name"
                type="text"
                className="form-input"
                value={formData.host_name}
                onChange={(e) => handleChange('host_name', e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="host_age">Idade do Anfitrião *</label>
              <input
                id="host_age"
                type="number"
                className="form-input"
                value={formData.host_age || ''}
                onChange={(e) => handleChange('host_age', Number(e.target.value))}
                placeholder="Idade"
                min="1"
                max="120"
                required
              />
            </div>
          </div>

          <div className="family-members-section">
            <div className="family-members-header">
              <label>Demais membros da família</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddFamilyMember}
              >
                <FiPlus />
                Adicionar Membro
              </button>
            </div>

            {formData.family_members.map((member, index) => (
              <div key={index} className="family-member-row">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    value={member.name}
                    onChange={(e) => handleFamilyMemberChange(index, 'name', e.target.value)}
                    placeholder="Nome"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    className="form-input"
                    value={member.age || ''}
                    onChange={(e) => handleFamilyMemberChange(index, 'age', Number(e.target.value))}
                    placeholder="Idade"
                    min="1"
                    max="120"
                  />
                </div>
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => handleRemoveFamilyMember(index)}
                  title="Remover membro"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}

            {formData.family_members.length === 0 && (
              <p className="empty-message">Nenhum membro adicional cadastrado</p>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="form-section">
          <h4 className="section-title">Informações Adicionais</h4>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_converted}
                onChange={(e) => handleChange('is_converted', e.target.checked)}
              />
              <span>É convertido?</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.has_bible}
                onChange={(e) => handleChange('has_bible', e.target.checked)}
              />
              <span>Possui uma bíblia em casa?</span>
            </label>
          </div>
        </div>

        {/* Dias da Reunião */}
        <div className="form-section">
          <h4 className="section-title">Dias da Reunião *</h4>
          
          <div className="weekdays-group">
            {weekDays.map((day) => (
              <label key={day.id} className="weekday-label">
                <input
                  type="checkbox"
                  checked={formData.meeting_days.includes(day.id)}
                  onChange={() => handleMeetingDayToggle(day.id)}
                />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
