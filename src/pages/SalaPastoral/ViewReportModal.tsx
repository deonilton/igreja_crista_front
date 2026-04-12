import { useRef } from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import './SalaPastoral.css';
import '../Diaconia/CultReportModal.css';
import './PastoralReadReport.css';
import iframePrintCss from './ViewCultReportIframePrint.css?raw';
import { printElementInIframe } from '../../utils/printIframeDocument';

interface ViewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

function formatCasalPair(a?: string | null, b?: string | null) {
  const s1 = a?.trim();
  const s2 = b?.trim();
  if (s1 && s2) return `${s1} e ${s2}`;
  if (s1) return s1;
  if (s2) return s2;
  return '—';
}

export default function ViewReportModal({ isOpen, onClose, report }: ViewReportModalProps) {
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

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '-';
    return time.length >= 5 ? time.slice(0, 5) : time;
  };

  const parseJson = (str: string) => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const lideranca = parseJson(report.lideranca);
  const programacao = parseJson(report.programacao);

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
              <h1 className="modal-title">Relatório de Culto</h1>
              <p className="modal-subtitle">Igreja Cristã da Família Aparecida</p>
              <p className="modal-source">Origem: Diaconia</p>
            </div>

            <div className="topo-section">
              <div className="col-check">
                {report.cult_type_familia && <span className="check-label">Culto da Família (Domingo)</span>}
                {report.cult_type_oracao && <span className="check-label">Culto de Oração (Quarta-feira)</span>}
                {report.cult_type_adolescentes && <span className="check-label">Culto de Adolescentes (Sábado)</span>}
                {report.cult_type_outros && (
                  <span className="check-label">Outros: {report.cult_type_outros_texto || '—'}</span>
                )}
              </div>
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

            <div className="linha-dupla">
              <div className="campo">
                <span className="pastoral-field-label">Ministro da Palavra</span>
                <span className="pastoral-field-value">{report.ministro?.trim() || '—'}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Igreja</span>
                <span className="pastoral-field-value">{report.igreja?.trim() || '—'}</span>
              </div>
            </div>

            <div className="linha-dupla">
              <div className="campo">
                <span className="pastoral-field-label">Assunto</span>
                <span className="pastoral-field-value">{report.assunto?.trim() || '—'}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Texto</span>
                <span className="pastoral-field-value">{report.texto?.trim() || '—'}</span>
              </div>
            </div>

            <hr className="sep" />

            {lideranca.length > 0 && lideranca.some((item: any) => item.ministerio) && (
              <>
                <div className="secao-titulo">Integrantes da liderança presentes</div>
                <div className="lideranca-list">
                  {lideranca
                    .filter((item: any) => item.ministerio)
                    .map((item: any, i: number) => (
                      <div key={i} className="pastoral-field-row">
                        <span className="pastoral-field-label">{item.ministerio}</span>
                        <span className="pastoral-field-value">{item.lideres?.trim() || '—'}</span>
                      </div>
                    ))}
                </div>
                <hr className="sep" />
              </>
            )}

            <div className="secao-titulo">Frequência</div>
            <div className="freq-row">
              <div className="campo">
                <span className="pastoral-field-label">Adultos</span>
                <span className="pastoral-field-value">{report.freq_adultos ?? 0}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Crianças</span>
                <span className="pastoral-field-value">{report.freq_criancas ?? 0}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Adolescentes</span>
                <span className="pastoral-field-value">{report.freq_adolescentes ?? 0}</span>
              </div>
              <div className="campo">
                <span className="pastoral-field-label">Visitantes</span>
                <span className="pastoral-field-value">{report.freq_visitantes ?? 0}</span>
              </div>
              <div className="campo total-campo">
                <span className="pastoral-field-label">Total</span>
                <span className="pastoral-field-value">{report.freq_total ?? 0}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Escalas</div>
            <div className="escalas-block">
              <div className="pastoral-field-row">
                <span className="pastoral-field-label">Diácono responsável</span>
                <span className="pastoral-field-value">{report.diacono_responsavel?.trim() || '—'}</span>
              </div>
              <div className="pastoral-field-row">
                <span className="pastoral-field-label">Casal de recepção</span>
                <span className="pastoral-field-value">
                  {formatCasalPair(report.casal_recepcao_1, report.casal_recepcao_2)}
                </span>
              </div>
              <div className="pastoral-field-row">
                <span className="pastoral-field-label">Casal da Santa Ceia</span>
                <span className="pastoral-field-value">
                  {formatCasalPair(report.casal_santa_ceia_1, report.casal_santa_ceia_2)}
                </span>
              </div>
            </div>

            {programacao.length > 0 && programacao[0].descricao && (
              <>
                <hr className="sep" />
                <div className="secao-titulo">Programação</div>
                {programacao.map((item: any, i: number) => (
                  <div className="linha-dupla" key={i}>
                    <div className="campo">
                      <span className="pastoral-field-label">Descrição</span>
                      <span className="pastoral-field-value">{item.descricao?.trim() || '—'}</span>
                    </div>
                    <div className="campo">
                      <span className="pastoral-field-label">Horário</span>
                      <span className="pastoral-field-value">{formatTime(item.horario)}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {report.ocorrencias_gerais ? (
              <>
                <hr className="sep" />
                <div className="secao-titulo">Ocorrências gerais</div>
                <textarea className="ocorrencias-textarea" value={report.ocorrencias_gerais} readOnly rows={4} />
              </>
            ) : null}

            <hr className="sep" />

            <div className="pastoral-field-row responsavel-footer">
              <span className="pastoral-field-label">Responsável pelo relatório</span>
              <span className="pastoral-field-value">{report.responsavel?.trim() || '—'}</span>
            </div>
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
