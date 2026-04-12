import { useState, useEffect, FormEvent } from 'react';
import api from '../../services/api';
import type { FullCasaDePaz } from '../../types/casaDePaz';
import Modal from '../../components/Modal';
import { showWarning, showError } from '../../utils/swalConfig';
import { localISODate, toDateInputValue } from '../../utils/localDate';
import '../Diaconia/CultReportModal.css';
import './EvangelismoReportModal.css';

interface EvangelismoReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingReport?: any | null;
  casas: FullCasaDePaz[];
}

const defaultFormData = () => ({
  casa_de_paz_id: 0,
  cult_date: localISODate(),
  horario_inicio: '',
  horario_termino: '',
  responsavel: '',
  endereco: '',
  bairro: '',
  participantes: '',
  new_visitors: 0,
  conversions: 0,
  offeringAmount: 0,
  observacoes: ''
});

function formatCepDisplay(cep: string): string {
  const d = String(cep ?? '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Monta uma linha de endereço a partir do cadastro da Casa de Paz. */
function buildEnderecoFromCasa(c: FullCasaDePaz): string {
  const parts: string[] = [];
  const street = (c.street ?? '').trim();
  const number = (c.number ?? '').trim();
  const line1 = [street, number].filter(Boolean).join(', ');
  if (line1) parts.push(line1);
  const comp = (c.complement ?? '').trim();
  if (comp) parts.push(comp);
  const cepFmt = formatCepDisplay(c.cep ?? '');
  const city = (c.city ?? '').trim();
  const state = (c.state ?? '').trim();
  const cityState = [city, state].filter(Boolean).join('/');
  const tail = [cepFmt, cityState].filter(Boolean).join(' · ');
  if (tail) parts.push(tail);
  return parts.join(' — ');
}

/** Anfitrião e demais membros da família cadastrados na Casa de Paz. */
function buildParticipantesFromCasa(c: FullCasaDePaz): string {
  const names: string[] = [];
  const host = (c.host_name ?? '').trim();
  if (host) names.push(host);
  for (const m of c.family_members ?? []) {
    const n = (m.name ?? '').trim();
    if (n) names.push(n);
  }
  return names.join(', ');
}

export default function EvangelismoReportModal({
  isOpen,
  onClose,
  onSuccess,
  editingReport,
  casas
}: EvangelismoReportModalProps) {
  const [formData, setFormData] = useState(defaultFormData());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingReport) {
      setFormData({
        casa_de_paz_id: editingReport.casa_de_paz_id,
        cult_date: toDateInputValue(editingReport.cult_date),
        horario_inicio: editingReport.horario_inicio || '',
        horario_termino: editingReport.horario_termino || '',
        responsavel: editingReport.responsavel || '',
        endereco: editingReport.endereco || '',
        bairro: editingReport.bairro || '',
        participantes: editingReport.participantes || '',
        new_visitors: editingReport.new_visitors || 0,
        conversions: editingReport.conversions || 0,
        offeringAmount: editingReport.offeringAmount || 0,
        observacoes: editingReport.observacoes || ''
      });
    } else {
      setFormData(defaultFormData());
    }
  }, [editingReport, isOpen]);

  const handleCasaChange = (casaId: number) => {
    if (!casaId) {
      setFormData(prev => ({
        ...prev,
        casa_de_paz_id: 0,
        responsavel: '',
        endereco: '',
        bairro: '',
        participantes: '',
      }));
      return;
    }

    const selectedCasa = casas.find(c => c.id === casaId);
    if (!selectedCasa) {
      setFormData(prev => ({ ...prev, casa_de_paz_id: casaId }));
      return;
    }

    const endereco = buildEnderecoFromCasa(selectedCasa);
    const participantes = buildParticipantesFromCasa(selectedCasa);

    setFormData(prev => ({
      ...prev,
      casa_de_paz_id: casaId,
      responsavel: (selectedCasa.responsible_name ?? '').trim(),
      endereco,
      bairro: (selectedCasa.neighborhood ?? '').trim(),
      participantes,
    }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.casa_de_paz_id) {
      showWarning('Selecione uma Casa de Paz');
      return;
    }
    if (!formData.cult_date) {
      showWarning('Informe a data');
      return;
    }
    if (!formData.responsavel) {
      showWarning('Informe o responsável');
      return;
    }

    setLoading(true);
    try {
      if (editingReport) {
        await api.put(`/evangelismo/reports/${editingReport.id}`, formData);
      } else {
        await api.post('/evangelismo/reports', formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      showError('Erro ao salvar relatório');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
        Cancelar
      </button>
      <button type="submit" form="evangelismo-report-form" className="btn btn-primary" disabled={loading}>
        {loading ? 'Salvando...' : editingReport ? 'Atualizar' : 'Salvar'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Evangelismo"
      subtitle="Igreja Cristã da Família Aparecida"
      footer={footer}
      maxWidth="1400px"
    >
      <form id="evangelismo-report-form" onSubmit={handleSubmit}>
        <div className="cult-report-content small-family-report-content">
          <div className="topo-section small-family-top-section">
            <div className="campo small-family-family-field">
              <span>Casa de Paz *</span>
              <select
                value={formData.casa_de_paz_id}
                onChange={e => handleCasaChange(parseInt(e.target.value))}
                className="small-family-select"
                required
              >
                <option value={0}>Selecione...</option>
                {casas.map(casa => (
                  <option key={casa.id} value={casa.id}>
                    {casa.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-data">
              <div className="data-row">
                <span>Data:</span>
                <input
                  type="date"
                  value={formData.cult_date}
                  onChange={e => handleChange('cult_date', e.target.value)}
                  required
                />
              </div>
              <div className="data-row">
                <span>Horário de Início:</span>
                <input
                  type="time"
                  value={formData.horario_inicio}
                  onChange={e => handleChange('horario_inicio', e.target.value)}
                />
              </div>
              <div className="data-row">
                <span>Horário de Término:</span>
                <input
                  type="time"
                  value={formData.horario_termino}
                  onChange={e => handleChange('horario_termino', e.target.value)}
                />
              </div>
            </div>
          </div>

          <hr className="sep" />

          <div className="linha-dupla">
            <div className="campo">
              <span>Responsável *</span>
              <input
                type="text"
                value={formData.responsavel}
                onChange={e => handleChange('responsavel', e.target.value)}
                placeholder="Nome do responsável"
                required
              />
            </div>
            <div className="campo">
              <span>Participantes</span>
              <input
                type="text"
                value={formData.participantes}
                onChange={e => handleChange('participantes', e.target.value)}
                placeholder="Nomes dos participantes"
              />
            </div>
          </div>

          <div className="linha-dupla">
            <div className="campo">
              <span>Endereço</span>
              <input
                type="text"
                value={formData.endereco}
                onChange={e => handleChange('endereco', e.target.value)}
                placeholder="Endereço do encontro"
              />
            </div>
            <div className="campo">
              <span>Bairro</span>
              <input
                type="text"
                value={formData.bairro}
                onChange={e => handleChange('bairro', e.target.value)}
                placeholder="Bairro"
              />
            </div>
          </div>

          <div className="linha-dupla">
            <div className="campo">
              <span>Novos Visitantes</span>
              <input
                type="number"
                value={formData.new_visitors}
                onChange={e => handleChange('new_visitors', parseInt(e.target.value) || 0)}
                placeholder="Quantidade"
                min="0"
              />
            </div>
            <div className="campo">
              <span>Conversões</span>
              <input
                type="number"
                value={formData.conversions}
                onChange={e => handleChange('conversions', parseInt(e.target.value) || 0)}
                placeholder="Quantidade"
                min="0"
              />
            </div>
          </div>

          <hr className="sep" />

          <div className="secao-titulo">Observações</div>
          <textarea
            value={formData.observacoes}
            onChange={e => handleChange('observacoes', e.target.value)}
            placeholder="Observações gerais..."
            rows={4}
            className="ocorrencias-textarea"
          />
        </div>
      </form>
    </Modal>
  );
}
