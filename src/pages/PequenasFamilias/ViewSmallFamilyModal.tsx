import { FiTrash2 } from 'react-icons/fi';
import Modal from '../../components/Modal';
import type { FullSmallFamily } from '../../types/smallFamilies';
import './ViewSmallFamilyModal.css';

interface ViewSmallFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: FullSmallFamily | null;
  canManage?: boolean;
  onDelete?: () => void;
}

const weekDayLabels: Record<string, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
};

export default function ViewSmallFamilyModal({
  isOpen,
  onClose,
  family,
  canManage = false,
  onDelete,
}: ViewSmallFamilyModalProps) {
  if (!family) return null;

  const footer = (
    <>
      <button type="button" className="btn btn-secondary btn-md" onClick={onClose}>
        Fechar
      </button>
      {canManage && onDelete && (
        <button type="button" className="btn btn-danger btn-md" onClick={onDelete}>
          <FiTrash2 style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Excluir
        </button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={family.name}
      subtitle={`Cadastrada em ${new Date(family.created_at).toLocaleDateString('pt-BR')}`}
      footer={footer}
      maxWidth="800px"
    >
      <div className="view-family-content">
        {/* Responsável */}
        <div className="view-section">
          <div className="info-row-inline">
            <strong>Responsável:</strong>
            <span>{family.responsible_name}</span>
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
                <p>{family.cep}</p>
              </div>
              <div className="info-item">
                <label>Número</label>
                <p>{family.number}</p>
              </div>
            </div>
            {family.street && (
              <div className="info-item">
                <label>Rua</label>
                <p>{family.street}</p>
              </div>
            )}
            {family.complement && (
              <div className="info-item">
                <label>Complemento</label>
                <p>{family.complement}</p>
              </div>
            )}
            <div className="info-grid">
              {family.neighborhood && (
                <div className="info-item">
                  <label>Bairro</label>
                  <p>{family.neighborhood}</p>
                </div>
              )}
              {family.city && (
                <div className="info-item">
                  <label>Cidade</label>
                  <p>{family.city}/{family.state}</p>
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
                <p>{family.host_name}</p>
              </div>
              <div className="info-item">
                <label>Idade</label>
                <p>{family.host_age} anos</p>
              </div>
            </div>

            {family.family_members.length > 0 && (
              <div className="family-members-list">
                <label>Demais membros da família</label>
                <div className="members-table">
                  {family.family_members.map((member, index) => (
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
              <div className={`info-badge ${family.is_converted ? 'active' : 'inactive'}`}>
                <span className="badge-label">É convertido?</span>
                <span className="badge-value">{family.is_converted ? 'Sim' : 'Não'}</span>
              </div>
              <div className={`info-badge ${family.has_bible ? 'active' : 'inactive'}`}>
                <span className="badge-label">Possui bíblia em casa?</span>
                <span className="badge-value">{family.has_bible ? 'Sim' : 'Não'}</span>
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
              {family.meeting_days.map((day) => (
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
