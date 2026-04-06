import { useState, useEffect, FormEvent } from 'react';
import api from '../../services/api';
import type { SmallFamily } from '../../types/smallFamilies';
import Modal from '../../components/Modal';
import { showWarning, showError } from '../../utils/swalConfig';
import '../Diaconia/CultReportModal.css';
import './SmallFamilyReportModal.css';

interface SmallFamilyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingReport?: any | null;
  families: SmallFamily[];
}

const defaultFormData = () => ({
  family_id: 0,
  cult_date: new Date().toISOString().split('T')[0],
  horario_inicio: '',
  horario_termino: '',
  responsavel: '',
  endereco: '',
  bairro: '',
  participantes: '',
  offeringAmount: 0,
  observacoes: ''
});

export default function SmallFamilyReportModal({
  isOpen,
  onClose,
  onSuccess,
  editingReport,
  families
}: SmallFamilyReportModalProps) {
  const [formData, setFormData] = useState(defaultFormData());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingReport) {
      setFormData({
        family_id: editingReport.family_id,
        cult_date: editingReport.cult_date?.split('T')[0] || '',
        horario_inicio: editingReport.horario_inicio || '',
        horario_termino: editingReport.horario_termino || '',
        responsavel: editingReport.responsavel || '',
        endereco: editingReport.endereco || '',
        bairro: editingReport.bairro || '',
        participantes: editingReport.participantes || '',
        offeringAmount: editingReport.offeringAmount || 0,
        observacoes: editingReport.observacoes || ''
      });
    } else {
      setFormData(defaultFormData());
    }
  }, [editingReport, isOpen]);

  const handleFamilyChange = (familyId: number) => {
    const selectedFamily = families.find(f => f.id === familyId);
    setFormData(prev => ({
      ...prev,
      family_id: familyId,
      responsavel: selectedFamily?.member?.full_name || prev.responsavel
    }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.family_id) {
      showWarning('Selecione uma pequena família');
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
        await api.put(`/small-family-reports/${editingReport.id}`, formData);
      } else {
        await api.post('/small-family-reports', formData);
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
      <button type="submit" form="small-family-report-form" className="btn btn-primary" disabled={loading}>
        {loading ? 'Salvando...' : editingReport ? 'Atualizar' : 'Salvar'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Pequena Família"
      subtitle="Igreja Cristã da Família Aparecida"
      footer={footer}
      maxWidth="1400px"
    >
      <form id="small-family-report-form" onSubmit={handleSubmit}>
        <div className="cult-report-content small-family-report-content">
          <div className="topo-section small-family-top-section">
            <div className="campo small-family-family-field">
              <span>Pequena Família *</span>
              <select
                value={formData.family_id}
                onChange={e => handleFamilyChange(parseInt(e.target.value))}
                className="small-family-select"
                required
              >
                <option value={0}>Selecione...</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>
                    {family.member?.full_name}
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
