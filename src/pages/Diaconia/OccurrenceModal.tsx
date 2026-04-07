import { useState, useEffect, FormEvent } from 'react';
import { FiX } from 'react-icons/fi';
import Swal from '../../utils/swalConfig';
import api from '../../services/api';
import type { OccurrenceFormData } from '../../types';
import './CultReportModal.css';

interface OccurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOccurrence?: any;
  ministryId: string;
}

export default function OccurrenceModal({ isOpen, onClose, onSuccess, editingOccurrence, ministryId }: OccurrenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OccurrenceFormData>({
    date: new Date().toISOString().split('T')[0],
    reporter_name: '',
    witnesses: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    
    if (editingOccurrence) {
      setFormData({
        date: editingOccurrence.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        reporter_name: editingOccurrence.reporter_name || '',
        witnesses: editingOccurrence.witnesses || '',
        location: editingOccurrence.location || '',
        description: editingOccurrence.description || ''
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reporter_name: '',
        witnesses: '',
        location: '',
        description: ''
      });
    }
  }, [isOpen, editingOccurrence]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingOccurrence) {
        await api.put(`/occurrences/${editingOccurrence.id}`, { ...formData, ministry_id: ministryId });
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Ocorrência atualizada com sucesso!',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
      } else {
        await api.post('/occurrences', { ...formData, ministry_id: ministryId });
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Ocorrência registrada com sucesso!',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: error.response?.data?.error || 'Erro ao salvar ocorrência',
        background: '#f9fafb',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content cult-report-modal">
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="cult-report-content">
              <div className="modal-title-section">
                <h1 className="modal-title">Registro de Ocorrência</h1>
                <p className="modal-subtitle">Igreja Cristã da Família Aparecida</p>
              </div>

              <div className="topo-section">
                <div className="col-data">
                  <div className="data-row">
                    <span>Data da Ocorrência:</span>
                    <input 
                      type="date" 
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="data-row">
                    <span>Local:</span>
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Local da ocorrência"
                    />
                  </div>
                </div>
              </div>

              <hr className="sep" />

              <div className="linha-dupla">
                <div className="campo">
                  <span>Responsável pelo registro:</span>
                  <input 
                    type="text" 
                    name="reporter_name"
                    value={formData.reporter_name}
                    onChange={handleChange}
                    placeholder="Nome de quem está registrando"
                  />
                </div>
                <div className="campo">
                  <span>Testemunhas:</span>
                  <input 
                    type="text" 
                    name="witnesses"
                    value={formData.witnesses}
                    onChange={handleChange}
                    placeholder="Nomes das testemunhas"
                  />
                </div>
              </div>

              <hr className="sep" />

              <div className="secao-titulo">Descrição da Ocorrência:</div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o que aconteceu..."
                rows={6}
                className="ocorrencias-textarea"
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : (editingOccurrence ? 'Atualizar' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
