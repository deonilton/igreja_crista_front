import { useState, FormEvent } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { showWarning, showError, showSuccess } from '../../utils/swalConfig';
import { FiAlertCircle, FiCalendar, FiMapPin, FiUser, FiUsers, FiFileText } from 'react-icons/fi';
import './OccurrenceModal.css';

interface OccurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ministryId: string;
}

const defaultFormData = () => ({
  date: new Date().toISOString().split('T')[0],
  reporter_name: '',
  witnesses: '',
  location: '',
  description: ''
});

export default function OccurrenceModal({
  isOpen,
  onClose,
  onSuccess,
  ministryId
}: OccurrenceModalProps) {
  const [formData, setFormData] = useState(defaultFormData());
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.date) {
      showWarning('Informe a data da ocorrência');
      return;
    }
    if (!formData.reporter_name.trim()) {
      showWarning('Informe o nome de quem está relatando');
      return;
    }
    if (!formData.location.trim()) {
      showWarning('Informe o local da ocorrência');
      return;
    }
    if (!formData.description.trim()) {
      showWarning('Descreva a ocorrência');
      return;
    }

    setLoading(true);
    try {
      await api.post('/occurrences', { ...formData, ministry_id: ministryId });
      showSuccess('Ocorrência registrada com sucesso!');
      onSuccess();
      onClose();
      setFormData(defaultFormData());
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
      showError('Erro ao registrar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Ocorrência" maxWidth="600px">
      <form onSubmit={handleSubmit} className="occurrence-form">
        <div className="form-group">
          <label htmlFor="date">
            <FiCalendar />
            Data da Ocorrência *
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reporter_name">
            <FiUser />
            Quem está relatando *
          </label>
          <input
            type="text"
            id="reporter_name"
            value={formData.reporter_name}
            onChange={(e) => handleChange('reporter_name', e.target.value)}
            placeholder="Nome de quem está registrando a ocorrência"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">
            <FiMapPin />
            Local da Ocorrência *
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Ex: Estacionamento, Salão principal, etc."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="witnesses">
            <FiUsers />
            Testemunhas (opcional)
          </label>
          <input
            type="text"
            id="witnesses"
            value={formData.witnesses}
            onChange={(e) => handleChange('witnesses', e.target.value)}
            placeholder="Nomes das testemunhas, se houver"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">
            <FiFileText />
            Descrição da Ocorrência *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva detalhadamente o que aconteceu..."
            rows={5}
            required
          />
        </div>

        <div className="form-actions">
          <Button
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={loading}
            icon={<FiAlertCircle />}
          >
            {loading ? 'Registrando...' : 'Registrar Ocorrência'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
