import Modal from '../../components/Modal';
import type { FullCasaDePaz } from '../../types/casaDePaz';
import './ViewCasaDePazModal.css';

interface ViewCasaDePazModalProps {
  isOpen: boolean;
  onClose: () => void;
  casa: FullCasaDePaz | null;
}

const weekDayLabels: Record<string, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
};

export default function ViewCasaDePazModal({
  isOpen,
  onClose,
  casa,
}: ViewCasaDePazModalProps) {
  if (!casa) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={casa.name}
      subtitle={`Cadastrada em ${new Date(casa.created_at).toLocaleDateString('pt-BR')}`}
      maxWidth="800px"
    >
      <div className="view-family-content">
        {/* Responsável */}
        <div className="view-section">
          <div className="info-row-inline">
            <strong>Responsável:</strong>
            <span>{casa.responsible_name}</span>
          </div>
        </div>

        {/* Endereço */}
        <div className="view-section">
          <div className="section-header">
            <h3>Endereço</h3>
          </div>
          <div className="section-body">
            <div className="info-grid">
              <div className="info-item">
                <label>CEP</label>
                <p>{casa.cep}</p>
              </div>
              <div className="info-item">
                <label>Número</label>
                <p>{casa.number}</p>
              </div>
            </div>
            {casa.street && (
              <div className="info-item">
                <label>Rua</label>
                <p>{casa.street}</p>
              </div>
            )}
            {casa.complement && (
              <div className="info-item">
                <label>Complemento</label>
                <p>{casa.complement}</p>
              </div>
            )}
            <div className="info-grid">
              {casa.neighborhood && (
                <div className="info-item">
                  <label>Bairro</label>
                  <p>{casa.neighborhood}</p>
                </div>
              )}
              {casa.city && (
                <div className="info-item">
                  <label>Cidade</label>
                  <p>{casa.city}/{casa.state}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Família */}
        <div className="view-section">
          <div className="section-header">
            <h3>Família</h3>
          </div>
          <div className="section-body">
            <div className="info-grid">
              <div className="info-item">
                <label>Anfitrião</label>
                <p>{casa.host_name}</p>
              </div>
              <div className="info-item">
                <label>Idade</label>
                <p>{casa.host_age} anos</p>
              </div>
            </div>

            {casa.family_members.length > 0 && (
              <div className="family-members-list">
                <label>Demais membros da família</label>
                <div className="members-table">
                  {casa.family_members.map((member, index) => (
                    <div key={index} className="member-row">
                      <span className="member-name">{member.name}</span>
                      <span className="member-age">{member.age} anos</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="view-section">
          <div className="section-header">
            <h3>Informações Adicionais</h3>
          </div>
          <div className="section-body">
            <div className="info-badges">
              <div className={`info-badge ${casa.is_converted ? 'active' : 'inactive'}`}>
                <span className="badge-label">É convertido?</span>
                <span className="badge-value">{casa.is_converted ? 'Sim' : 'Não'}</span>
              </div>
              <div className={`info-badge ${casa.has_bible ? 'active' : 'inactive'}`}>
                <span className="badge-label">Possui bíblia em casa?</span>
                <span className="badge-value">{casa.has_bible ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dias de Reunião */}
        <div className="view-section">
          <div className="section-header">
            <h3>Dias de Reunião</h3>
          </div>
          <div className="section-body">
            <div className="meeting-days">
              {casa.meeting_days.map((day) => (
                <span key={day} className="day-badge">
                  {weekDayLabels[day] || day}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
