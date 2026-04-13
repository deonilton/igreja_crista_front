import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiCalendar,
  FiBook,
  FiMessageSquare,
  FiSettings,
  FiFileText,
  FiAlertCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import AconselhamentoAgenda from './AconselhamentoAgenda';
import ViewReportModal from './ViewReportModal';
import ViewOccurrenceModal from './ViewOccurrenceModal';
import ViewSmallFamilyReportModal from './ViewSmallFamilyReportModal';
import ViewCasaDePazReportModal from './ViewCasaDePazReportModal';
import api from '../../services/api';
import { localISODate, apiCivilDateKey } from '../../utils/localDate';
import './SalaPastoral.css';

interface CultReport {
  id: number;
  cult_date: string;
  ministro: string;
  assunto: string;
  freq_total: number;
  ministry_name?: string;
}

interface SmallFamilyReport {
  id: number;
  family_id: number;
  family_name: string;
  cult_date: string;
  responsavel: string;
  endereco: string;
  bairro: string;
  participantes: string;
  offering_amount: number;
  observacoes: string;
}

interface Occurrence {
  id: number;
  date: string;
  location: string;
  reporter_name: string;
}

interface EvangelismoReportPastoral {
  id: number;
  casa_de_paz_id: number;
  casa_name: string;
  cult_date: string;
  horario_inicio?: string | null;
  horario_termino?: string | null;
  responsavel: string;
  endereco?: string | null;
  bairro?: string | null;
  participantes?: string | null;
  new_visitors: number;
  conversions: number;
  offeringAmount: number;
  observacoes?: string | null;
}

interface Aconselhamento {
  id: number;
  data: string;
  nome_pessoa: string;
  telefone: string;
  horario: string;
  status: string;
}

/** Painel principal da Sala Pastoral (`/sala-pastoral/painel`). */
export default function SalaPastoralDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [showAgenda, setShowAgenda] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [cultReports, setCultReports] = useState<CultReport[]>([]);
  const [smallFamilyReports, setSmallFamilyReports] = useState<SmallFamilyReport[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [evangelismoReports, setEvangelismoReports] = useState<EvangelismoReportPastoral[]>([]);
  const [aconselhamentos, setAconselhamentos] = useState<Aconselhamento[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedSmallFamilyReport, setSelectedSmallFamilyReport] = useState<any>(null);
  const [selectedEvangelismoReport, setSelectedEvangelismoReport] = useState<EvangelismoReportPastoral | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<{ key: string; label: string; data: Aconselhamento[] } | null>(
    null
  );
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const { user } = useAuth();

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function getWeekDays(startDate: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }

  const previousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = localISODate(date);

    const cultReportsForDay = cultReports.filter((r) => apiCivilDateKey(r.cult_date) === dateStr);

    const smallFamilyReportsForDay = smallFamilyReports.filter((r) => apiCivilDateKey(r.cult_date) === dateStr);

    const occurrencesForDay = occurrences.filter((o) => apiCivilDateKey(o.date) === dateStr);

    const evangelismoForDay = evangelismoReports.filter((r) => apiCivilDateKey(r.cult_date) === dateStr);

    return {
      cultReports: cultReportsForDay,
      smallFamilyReports: smallFamilyReportsForDay,
      occurrences: occurrencesForDay,
      evangelismoReports: evangelismoForDay,
      total:
        cultReportsForDay.length +
        smallFamilyReportsForDay.length +
        occurrencesForDay.length +
        evangelismoForDay.length,
    };
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (showReports) {
      loadData();
    }
  }, [showReports]);

  const loadData = async () => {
    try {
      const [pastoralRes, aconselhamentosRes] = await Promise.all([
        api.get('/pastoral-room'),
        api.get('/aconselhamentos?limit=100'),
      ]);

      const data = pastoralRes.data;
      setCultReports(data.cultReports || []);
      setSmallFamilyReports(data.smallFamilyReports || []);
      setOccurrences(data.occurrences || []);
      setEvangelismoReports(data.evangelismoReports || []);
      setAconselhamentos(aconselhamentosRes.data.appointments || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  if (showAgenda) {
    return <AconselhamentoAgenda onBack={() => setShowAgenda(false)} />;
  }

  if (loading) {
    return (
      <div className="sala-pastoral-loading">
        <div className="spinner"></div>
        Carregando Sala Pastoral...
      </div>
    );
  }

  if (showReports) {
    const weekDays = getWeekDays(currentWeekStart);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const today = localISODate();

    return (
      <div className="sala-pastoral">
        <div className="sala-pastoral-header">
          <h1>Relatórios e Ocorrências</h1>
          <p>Visualize relatórios de culto, pequenas famílias, casas de paz e ocorrências da igreja</p>
        </div>

        <button className="pastoral-btn" onClick={() => setShowReports(false)} style={{ marginBottom: '20px' }}>
          ← Voltar
        </button>

        <div className="weekly-calendar">
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={previousWeek}>
              <FiChevronLeft />
            </button>
            <div className="calendar-title">
              <h3>
                {monthNames[currentWeekStart.getMonth()]} {currentWeekStart.getFullYear()}
              </h3>
              <button className="today-btn" onClick={goToCurrentWeek}>
                Hoje
              </button>
            </div>
            <button className="calendar-nav-btn" onClick={nextWeek}>
              <FiChevronRight />
            </button>
          </div>

          <div className="calendar-days">
            {weekDays.map((day, index) => {
              const dayStr = localISODate(day);
              const events = getEventsForDay(day);
              const isToday = dayStr === today;

              return (
                <div key={index} className={`calendar-day ${isToday ? 'today' : ''}`}>
                  <div className="day-header">
                    <span className="day-name">{dayNames[index]}</span>
                    <span className="day-number">{day.getDate()}</span>
                  </div>
                  <div className="day-events">
                    {events.total > 0 ? (
                      <>
                        {events.cultReports.map((report) => (
                          <div
                            key={`cult-${report.id}`}
                            className="event-item cult-event"
                            onClick={() => setSelectedReport(report)}
                          >
                            <FiFileText size={12} />
                            <span>Culto</span>
                          </div>
                        ))}
                        {events.smallFamilyReports.map((report) => (
                          <div
                            key={`family-${report.id}`}
                            className="event-item family-event"
                            onClick={() => setSelectedSmallFamilyReport(report)}
                          >
                            <FiFileText size={12} />
                            <span>Pequena Família</span>
                          </div>
                        ))}
                        {events.evangelismoReports.map((report) => (
                          <div
                            key={`casa-paz-${report.id}`}
                            className="event-item casa-paz-event"
                            onClick={() => setSelectedEvangelismoReport(report)}
                          >
                            <FiFileText size={12} />
                            <span>Casa de Paz</span>
                          </div>
                        ))}
                        {events.occurrences.map((occ) => (
                          <div
                            key={`occ-${occ.id}`}
                            className="event-item occurrence-event"
                            onClick={() => setSelectedOccurrence(occ)}
                          >
                            <FiAlertCircle size={12} />
                            <span>Ocorrência</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <span className="no-events">Sem eventos</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sala-pastoral-section">
          <h2>Aconselhamentos Pastorais</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>Clique em um mês para ver os aconselhamentos</p>

          <div className="months-grid">
            {['04', '05', '06'].map((monthNum) => {
              const monthLabel = monthNames[parseInt(monthNum) - 1];
              const year = new Date().getFullYear();
              const monthKey = `${year}-${monthNum}`;

              const monthAconselhamentos = aconselhamentos.filter(
                (a: Aconselhamento) => a.status !== 'cancelado' && a.data?.startsWith(monthKey)
              );

              return (
                <div
                  key={monthKey}
                  className="month-card"
                  onClick={() => {
                    setSelectedMonth({ key: monthKey, label: monthLabel, data: monthAconselhamentos });
                  }}
                >
                  <h3>{monthLabel}</h3>
                  <span className="year">{year}</span>
                  <span className="count">
                    {monthAconselhamentos.length} aconselhamento{monthAconselhamentos.length !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {selectedMonth && (
          <div className="modal-overlay" onClick={() => setSelectedMonth(null)}>
            <div className="modal-content cult-report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Aconselhamentos - {selectedMonth.label}</h2>
                <button className="modal-close-btn" onClick={() => setSelectedMonth(null)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {selectedMonth.data.length > 0 ? (
                  <div className="recent-activities">
                    {selectedMonth.data.map((aconselhamento: any) => (
                      <div className="activity-item" key={aconselhamento.id}>
                        <div className="activity-icon">
                          <FiClock />
                        </div>
                        <div className="activity-content">
                          <h4>{aconselhamento.nome_pessoa}</h4>
                          <p>Horário: {aconselhamento.horario}</p>
                          <span className="activity-time">
                            {new Date(aconselhamento.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Nenhum aconselhamento neste mês</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedMonth(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <ViewReportModal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} report={selectedReport} />

        <ViewSmallFamilyReportModal
          isOpen={!!selectedSmallFamilyReport}
          onClose={() => setSelectedSmallFamilyReport(null)}
          report={selectedSmallFamilyReport}
        />

        <ViewCasaDePazReportModal
          isOpen={!!selectedEvangelismoReport}
          onClose={() => setSelectedEvangelismoReport(null)}
          report={selectedEvangelismoReport}
        />

        <ViewOccurrenceModal
          isOpen={!!selectedOccurrence}
          onClose={() => setSelectedOccurrence(null)}
          occurrence={selectedOccurrence}
        />
      </div>
    );
  }

  return (
    <div className="sala-pastoral">
      <div className="sala-pastoral-header">
        <h1>Sala Pastoral</h1>
        <p>Bem-vindo, Pastor {user?.name || 'Admin'}</p>
      </div>

      <div className="pastoral-grid">
        <div className="pastoral-card" onClick={() => setShowAgenda(true)} style={{ cursor: 'pointer' }}>
          <div className="pastoral-card-icon">
            <FiUser />
          </div>
          <div className="pastoral-card-content">
            <h3>Aconselhamento</h3>
            <p>Gerencie sessões de aconselhamento e acompanhamento pastoral</p>
            <button className="pastoral-btn">Ver Mais</button>
          </div>
        </div>

        <div className="pastoral-card">
          <div className="pastoral-card-icon">
            <FiCalendar />
          </div>
          <div className="pastoral-card-content">
            <h3>Agenda Pastoral</h3>
            <p>Visualize e organize seus compromissos e visitas pastorais</p>
            <button className="pastoral-btn">Ver Agenda</button>
          </div>
        </div>

        <div className="pastoral-card" onClick={() => navigate('/sala-pastoral')} style={{ cursor: 'pointer' }}>
          <div className="pastoral-card-icon">
            <FiBook />
          </div>
          <div className="pastoral-card-content">
            <h3>Estudos Bíblicos</h3>
            <p>Acesse materiais e prepare estudos bíblicos e pregações</p>
            <button type="button" className="pastoral-btn">
              Acessar
            </button>
          </div>
        </div>

        <div className="pastoral-card">
          <div className="pastoral-card-icon">
            <FiMessageSquare />
          </div>
          <div className="pastoral-card-content">
            <h3>Mensagens</h3>
            <p>Comunique-se com a liderança e membros da igreja</p>
            <button className="pastoral-btn">Ver Mensagens</button>
          </div>
        </div>

        <div className="pastoral-card" onClick={() => setShowReports(true)} style={{ cursor: 'pointer' }}>
          <div className="pastoral-card-icon">
            <FiFileText />
          </div>
          <div className="pastoral-card-content">
            <h3>Relatórios e Ocorrências</h3>
            <p>Visualize relatórios de culto, casas de paz e ocorrências registradas</p>
            <button className="pastoral-btn">Ver Mais</button>
          </div>
        </div>

        <div className="pastoral-card">
          <div className="pastoral-card-icon">
            <FiSettings />
          </div>
          <div className="pastoral-card-content">
            <h3>Configurações</h3>
            <p>Gerencie configurações específicas da sala pastoral</p>
            <button className="pastoral-btn">Configurar</button>
          </div>
        </div>
      </div>

      <div className="sala-pastoral-section">
        <h2>Atividades Recentes</h2>
        <div className="recent-activities">
          <div className="activity-item">
            <div className="activity-icon">
              <FiCalendar />
            </div>
            <div className="activity-content">
              <h4>Visita Pastoral - Família Silva</h4>
              <p>Agendada para amanhã às 14:00</p>
              <span className="activity-time">Hoje, 10:30</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <FiMessageSquare />
            </div>
            <div className="activity-content">
              <h4>Nova mensagem de aconselhamento</h4>
              <p>Irmão João solicitou orientação espiritual</p>
              <span className="activity-time">Hoje, 09:15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
