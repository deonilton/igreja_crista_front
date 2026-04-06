import { FiX } from 'react-icons/fi';
import './SalaPastoral.css';
import '../Diaconia/CultReportModal.css';

interface ViewOccurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: any;
}

export default function ViewOccurrenceModal({ isOpen, onClose, occurrence }: ViewOccurrenceModalProps) {
  if (!isOpen || !occurrence) return null;

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content cult-report-modal">
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="cult-report-content">
            <div className="modal-title-section">
              <h1 className="modal-title">Ocorrência</h1>
              <p className="modal-subtitle">Igreja Cristã da Família Aparecida</p>
              <p className="modal-source">Origem: {occurrence.location?.includes('Pequenas') ? 'Pequenas Famílias' : 'Diaconia'}</p>
            </div>

            <div className="topo-section">
              <div className="col-data">
                <div className="data-row">
                  <span>Data: {formatDate(occurrence.date)}</span>
                </div>
                <div className="data-row">
                  <span>Local: {occurrence.location || '-'}</span>
                </div>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Informações</div>
            <div className="linha-dupla">
              <div className="campo">
                <span>Responsável: {occurrence.reporter_name || '-'}</span>
              </div>
              <div className="campo">
                <span>Testemunhas: {occurrence.witnesses || '-'}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Descrição</div>
            <textarea className="ocorrencias-textarea" value={occurrence.description || 'Sem descrição.'} readOnly rows={6} />
          </div>

        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
