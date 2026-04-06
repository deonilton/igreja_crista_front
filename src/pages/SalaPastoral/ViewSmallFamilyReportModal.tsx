import { FiX } from 'react-icons/fi';
import './SalaPastoral.css';
import '../Diaconia/CultReportModal.css';

interface ViewSmallFamilyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

export default function ViewSmallFamilyReportModal({ isOpen, onClose, report }: ViewSmallFamilyReportModalProps) {
  if (!isOpen || !report) return null;

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
              <h1 className="modal-title">Relatório de Pequena Família</h1>
              <p className="modal-subtitle">{report.family_name}</p>
              <p className="modal-source">Origem: Pequenas Famílias</p>
            </div>

            <div className="topo-section">
              <div className="col-data">
                <div className="data-row">
                  <span>Data do Culto: {formatDate(report.cult_date)}</span>
                </div>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Informações da Família</div>
            <div className="linha-dupla">
              <div className="campo">
                <span>Responsável: {report.responsavel || '-'}</span>
              </div>
              <div className="campo">
                <span>Participantes: {report.participantes || '-'}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Localização</div>
            <div className="linha-dupla">
              <div className="campo">
                <span>Endereço: {report.endereco || '-'}</span>
              </div>
              <div className="campo">
                <span>Bairro: {report.bairro || '-'}</span>
              </div>
            </div>

            <hr className="sep" />

            <div className="secao-titulo">Oferta</div>
            <div className="campo">
              <span>Valor: {formatCurrency(report.offering_amount)}</span>
            </div>

            {report.observacoes && (
              <>
                <hr className="sep" />
                <div className="secao-titulo">Observações</div>
                <textarea className="ocorrencias-textarea" value={report.observacoes} readOnly rows={4} />
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
