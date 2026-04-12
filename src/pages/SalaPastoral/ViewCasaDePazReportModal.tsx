import { useRef } from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import './SalaPastoral.css';
import '../Diaconia/CultReportModal.css';
import './PastoralReadReport.css';
import iframePrintCss from './ViewCasaDePazReportIframePrint.css?raw';
import { printElementInIframe } from '../../utils/printIframeDocument';

interface ViewCasaDePazReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

export default function ViewCasaDePazReportModal({ isOpen, onClose, report }: ViewCasaDePazReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    const el = printAreaRef.current;
    if (!el) return;
    printElementInIframe(el, iframePrintCss);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    if (value == null || value === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const formatTime = (t: string | null | undefined) => {
    if (!t) return '-';
    return t.length >= 5 ? t.slice(0, 5) : t;
  };

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
              <h1 className="modal-title">Relatório de Casa de Paz</h1>
              <p className="modal-subtitle">{report.casa_name || '-'}</p>
              <p className="modal-source">Origem: Evangelismo e Missões</p>
            </div>

            <div className="topo-section">
              <div className="col-data">
                <div className="data-row">
                  <span>Data: {formatDate(report.cult_date)}</span>
                </div>
                <div className="data-row">
                  <span>Início: {formatTime(report.horario_inicio)}</span>
                </div>
                <div className="data-row">
                  <span>Término: {formatTime(report.horario_termino)}</span>
                </div>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Encontro</div>
            <div className="linha-dupla">
              <div className="campo">
                <span className="pastoral-field-label">Responsável</span>
                <span className="pastoral-field-value">{report.responsavel?.trim() || '—'}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Participantes</span>
                <span className="pastoral-field-value">{report.participantes?.trim() || '—'}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Localização</div>
            <div className="linha-dupla">
              <div className="campo">
                <span className="pastoral-field-label">Endereço</span>
                <span className="pastoral-field-value">{report.endereco?.trim() || '—'}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Bairro</span>
                <span className="pastoral-field-value">{report.bairro?.trim() || '—'}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Números</div>
            <div className="linha-dupla">
              <div className="campo">
                <span className="pastoral-field-label">Novos visitantes</span>
                <span className="pastoral-field-value">{report.new_visitors ?? 0}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Conversões</span>
                <span className="pastoral-field-value">{report.conversions ?? 0}</span>
              </div>
            </div>

            <div className="linha-dupla linha-dupla--single">
              <div className="campo">
                <span className="pastoral-field-label">Oferta</span>
                <span className="pastoral-field-value">{formatCurrency(report.offeringAmount)}</span>
              </div>
            </div>

            {report.observacoes ? (
              <>
                <hr className="sep" />
                <div className="secao-titulo">Observações</div>
                <textarea className="ocorrencias-textarea" value={report.observacoes} readOnly rows={4} />
              </>
            ) : null}
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
