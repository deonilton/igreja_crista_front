import { useRef } from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import './SalaPastoral.css';
import '../Diaconia/CultReportModal.css';
import './PastoralReadReport.css';
import iframePrintCss from './ViewCasaDePazReportIframePrint.css?raw';
import { printElementInIframe } from '../../utils/printIframeDocument';

interface ViewOccurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: any;
}

export default function ViewOccurrenceModal({ isOpen, onClose, occurrence }: ViewOccurrenceModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !occurrence) return null;

  const handlePrint = () => {
    const el = printAreaRef.current;
    if (!el) return;
    printElementInIframe(el, iframePrintCss);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const originLabel = occurrence.location?.includes('Pequenas') ? 'Pequenas Famílias' : 'Diaconia';

  return (
    <div className="modal-overlay pastoral-print-overlay">
      <div className="modal-content cult-report-modal pastoral-print-sheet">
        <div className="modal-header pastoral-no-print">
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div ref={printAreaRef} className="cult-report-content pastoral-read-report">
            <div className="modal-title-section">
              <h1 className="modal-title">Ocorrência</h1>
              <p className="modal-subtitle">Igreja Cristã da Família Aparecida</p>
              <p className="modal-source">Origem: {originLabel}</p>
            </div>

            <div className="topo-section">
              <div className="col-data">
                <div className="data-row">
                  <span>Data: {formatDate(occurrence.date)}</span>
                </div>
                <div className="data-row">
                  <span>Local: {occurrence.location?.trim() || '—'}</span>
                </div>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Informações</div>
            <div className="linha-dupla">
              <div className="campo">
                <span className="pastoral-field-label">Responsável</span>
                <span className="pastoral-field-value">{occurrence.reporter_name?.trim() || '—'}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Testemunhas</span>
                <span className="pastoral-field-value">{occurrence.witnesses?.trim() || '—'}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Descrição</div>
            <textarea
              className="ocorrencias-textarea"
              value={occurrence.description?.trim() || '—'}
              readOnly
              rows={6}
            />
          </div>
        </div>

        <div className="modal-footer pastoral-report-modal-actions pastoral-no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            title="Se ainda aparecer data ou link no topo ou rodapé da folha, desligue «Cabeçalhos e rodapés» nas opções da impressão (Chrome/Edge)."
          >
            <FiPrinter style={{ marginRight: 8, verticalAlign: 'middle' }} aria-hidden />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
