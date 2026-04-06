import { useState } from 'react';
import { FiX, FiUser, FiClock, FiFileText, FiPhone } from 'react-icons/fi';
import Swal from '../../utils/swalConfig';
import api from '../../services/api';
import './AconselhamentoAgenda.css';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSuccess: () => void;
  unavailableTimes: string[];
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

const getTimeSlotsAfter = (startTime: string) => {
  const startIndex = timeSlots.indexOf(startTime);
  if (startIndex === -1 || startIndex === timeSlots.length - 1) return [];
  return timeSlots.slice(startIndex + 1);
};

export default function ScheduleModal({ isOpen, onClose, selectedDate, onSuccess, unavailableTimes }: ScheduleModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; timeStart?: string; timeEnd?: string }>({});

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const validate = () => {
    const newErrors: { name?: string; timeStart?: string; timeEnd?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!timeStart) {
      newErrors.timeStart = 'Horário inicial é obrigatório';
    }
    if (!timeEnd) {
      newErrors.timeEnd = 'Horário final é obrigatório';
    }
    if (timeStart && timeEnd && timeStart >= timeEnd) {
      newErrors.timeEnd = 'Horário final deve ser maior que o inicial';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedDate) return;

    setLoading(true);
    try {
      const dataFormatada = selectedDate.toISOString().split('T')[0];
      const horario = `${timeStart} às ${timeEnd}`;
      
      await api.post('/aconselhamentos', {
        nome_pessoa: name.trim(),
        telefone: phone.trim(),
        data: dataFormatada,
        horario: horario,
        observacoes: notes.trim()
      });

      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Aconselhamento agendado com sucesso!',
        background: '#f9fafb',
        confirmButtonColor: '#3b82f6'
      });

      onSuccess();

      handleClose();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: error.response?.data?.error || 'Erro ao agendar aconselhamento',
        background: '#f9fafb',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setTimeStart('');
    setTimeEnd('');
    setNotes('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const endTimeOptions = timeStart ? getTimeSlotsAfter(timeStart) : [];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content schedule-modal larger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h2>Agendar Aconselhamento</h2>
            <p className="selected-date">{formatDate(selectedDate)}</p>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>
                <FiUser />
                Nome da Pessoa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome completo"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>
                <FiPhone />
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000 (opcional)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <FiClock />
                  Das
                </label>
                <select
                  value={timeStart}
                  onChange={(e) => { setTimeStart(e.target.value); setTimeEnd(''); }}
                  className={errors.timeStart ? 'error' : ''}
                >
                  <option value="">Selecione</option>
                  {timeSlots.map((slot) => {
                    const isUnavailable = unavailableTimes.includes(slot);
                    return (
                      <option key={slot} value={slot} disabled={isUnavailable}>
                        {slot} {isUnavailable ? '(Ocupado)' : ''}
                      </option>
                    );
                  })}
                </select>
                {errors.timeStart && <span className="error-message">{errors.timeStart}</span>}
              </div>

              <div className="form-group">
                <label>
                  <FiClock />
                  Até
                </label>
                <select
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className={errors.timeEnd ? 'error' : ''}
                  disabled={!timeStart}
                >
                  <option value="">Selecione</option>
                  {endTimeOptions.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.timeEnd && <span className="error-message">{errors.timeEnd}</span>}
              </div>
            </div>

            <div className="form-group full-width">
              <label>
                <FiFileText />
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o aconselhamento..."
                rows={4}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
