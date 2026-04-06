import { FiX } from 'react-icons/fi';
import './SalaPastoral.css';
import '../Diaconia/CultReportModal.css';

interface ViewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

export default function ViewReportModal({ isOpen, onClose, report }: ViewReportModalProps) {
  if (!isOpen || !report) return null;

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time;
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
    <div className="modal-overlay">
      <div className="modal-content cult-report-modal">
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="cult-report-content">
            <div className="modal-title-section">
              <h1 className="modal-title">Relatório de Culto</h1>
              <p className="modal-subtitle">Igreja Cristã da Família Aparecida</p>
              <p className="modal-source">Origem: Diaconia</p>
            </div>

            <div className="topo-section">
              <div className="col-check">
                {report.cult_type_familia && <label className="check-label">Culto da Família (Domingo)</label>}
                {report.cult_type_oracao && <label className="check-label">Culto de Oração (Quarta-feira)</label>}
                {report.cult_type_adolescentes && <label className="check-label">Culto de Adolescentes (Sábado)</label>}
                {report.cult_type_outros && <label className="check-label">Outros: {report.cult_type_outros_texto}</label>}
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
                <span>Ministro da Palavra: {report.ministro || '-'}</span>
              </div>
              <div className="campo">
                <span>Igreja: {report.igreja || '-'}</span>
              </div>
            </div>

            <div className="linha-dupla">
              <div className="campo">
                <span>Assunto: {report.assunto || '-'}</span>
              </div>
              <div className="campo">
                <span>Texto: {report.texto || '-'}</span>
              </div>
            </div>

            <hr className="sep" />

            {lideranca.length > 0 && lideranca.some((item: any) => item.ministerio) && (
              <>
                <div className="secao-titulo">Integrantes da liderança presentes:</div>
                {lideranca.filter((item: any) => item.ministerio).map((item: any, i: number) => (
                  <div key={i} className="lideranca-row">
                    <span>{item.ministerio}: {item.lideres}</span>
                  </div>
                ))}
                <hr className="sep" />
              </>
            )}

            <div className="secao-titulo">Frequência:</div>
            <div className="freq-row">
              <div className="campo">
                <span>Adultos: {report.freq_adultos || 0}</span>
              </div>
              <div className="campo">
                <span>Crianças: {report.freq_criancas || 0}</span>
              </div>
              <div className="campo">
                <span>Adolescentes: {report.freq_adolescentes || 0}</span>
              </div>
              <div className="campo">
                <span>Visitantes: {report.freq_visitantes || 0}</span>
              </div>
              <div className="campo total-campo">
                <span>Total: {report.freq_total || 0}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Escalas:</div>
            <div className="escala-row">
              <span>Diácono responsável:</span>
              <span>{report.diacono_responsavel || '-'}</span>
            </div>
            <div className="escala-row">
              <span>Casal de Recepção:</span>
              <span>{report.casal_recepcao_1} {report.casal_recepcao_2 ? `e ${report.casal_recepcao_2}` : '-'}</span>
            </div>
            <div className="escala-row">
              <span>Casal da Santa Ceia:</span>
              <span>{report.casal_santa_ceia_1} {report.casal_santa_ceia_2 ? `e ${report.casal_santa_ceia_2}` : '-'}</span>
            </div>

            {programacao.length > 0 && programacao[0].descricao && (
              <>
                <hr className="sep" />
                <div className="secao-titulo">Programação:</div>
                {programacao.map((item: any, i: number) => (
                  <div key={i} className="prog-row">
                    <span>{item.descricao || '-'}</span>
                    <span>Horário: {formatTime(item.horario)}</span>
                  </div>
                ))}
              </>
            )}

            {report.ocorrencias_gerais && (
              <>
                <hr className="sep" />
                <div className="secao-titulo">Ocorrências Gerais:</div>
                <textarea className="ocorrencias-textarea" value={report.ocorrencias_gerais} readOnly rows={4} />
              </>
            )}

            <hr className="sep" />

            <div className="responsavel-row">
              <span>Responsável pelo relatório:</span>
              <span>{report.responsavel || '-'}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
