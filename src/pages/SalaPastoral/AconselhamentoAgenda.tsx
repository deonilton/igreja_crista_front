import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiUser, FiPhone } from 'react-icons/fi';
import Swal from '../../utils/swalConfig';
import ScheduleModal from './ScheduleModal';
import api from '../../services/api';
import './AconselhamentoAgenda.css';

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

interface Appointment {
  id: number;
  date: Date;
  name: string;
  phone: string;
  time: string;
  notes: string;
}

interface AconselhamentoAgendaProps {
  onBack: () => void;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AconselhamentoAgenda({ onBack }: AconselhamentoAgendaProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/aconselhamentos?limit=100');
      const data = response.data.appointments || [];
      
      const formattedAppointments: Appointment[] = data.map((apt: any) => ({
        id: apt.id,
        date: new Date(apt.data),
        name: apt.nome_pessoa,
        phone: apt.telefone,
        time: apt.horario,
        notes: apt.observacoes || ''
      }));
      
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Erro ao carregar aconselhamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const getAppointmentsForDate = (day: number) => {
    return appointments.filter((apt) => {
      return (
        apt.date.getDate() === day &&
        apt.date.getMonth() === currentMonth &&
        apt.date.getFullYear() === currentYear
      );
    });
  };

  const getTimesForDate = (date: Date) => {
    const dayAppointments = appointments.filter((apt) => {
      return (
        apt.date.getDate() === date.getDate() &&
        apt.date.getMonth() === date.getMonth() &&
        apt.date.getFullYear() === date.getFullYear()
      );
    });
    
    const times: string[] = [];
    dayAppointments.forEach((apt) => {
      if (apt.time.includes(' às ')) {
        const [start, end] = apt.time.split(' às ');
        timeSlots.forEach((slot) => {
          if (slot >= start && slot < end) {
            times.push(slot);
          }
        });
      } else {
        times.push(apt.time);
      }
    });
    return times;
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(clickedDate);
    setShowScheduleModal(true);
  };

  const handleScheduleSuccess = async () => {
    setShowScheduleModal(false);
    await loadAppointments();
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: 'Cancelar Agendamento',
        text: 'Tem certeza que deseja cancelar este aconselhamento?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sim, cancelar',
        cancelButtonText: 'Não',
        background: '#f0f9ff'
      });

      if (result.isConfirmed) {
        await api.delete(`/aconselhamentos/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Cancelado!',
          text: 'Agendamento cancelado com sucesso.',
          background: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
        await loadAppointments();
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: error.response?.data?.error || 'Erro ao cancelar agendamento',
        background: '#f9fafb',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isPastDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  const getDayOfWeek = (day: number) => {
    return new Date(currentYear, currentMonth, day).getDay();
  };

  const isCultoDay = (day: number) => {
    const dayOfWeek = getDayOfWeek(day);
    return dayOfWeek === 0 || dayOfWeek === 3;
  };

  const getCultoSchedule = (day: number) => {
    const dayOfWeek = getDayOfWeek(day);
    if (dayOfWeek === 3) return '20h - 21h';
    if (dayOfWeek === 0) return '19h - 21h';
    return '';
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDay + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;
      const dayAppointments = isCurrentMonth ? getAppointmentsForDate(day) : [];
      const today = isCurrentMonth && isToday(day);
      const past = isCurrentMonth && isPastDay(day);
      const isCulto = isCurrentMonth && isCultoDay(day);

      days.push(
        <div
          key={i}
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${today ? 'today' : ''} ${past ? 'past-day' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''} ${isCulto ? 'culto-day' : ''}`}
          onClick={() => isCurrentMonth && !past && handleDayClick(day)}
          title={isCulto ? `Culto - ${getCultoSchedule(day)}` : ''}
        >
          <span className="day-number">{isCurrentMonth ? day : ''}</span>
          {isCulto && !today && (
            <span className="culto-badge">C</span>
          )}
          {dayAppointments.length > 0 && (
            <div className="appointment-indicators">
              {dayAppointments.slice(0, 3).map((apt) => (
                <span key={apt.id} className="appointment-dot" title={`${apt.time} - ${apt.name}`}></span>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const getAppointmentsForMonth = () => {
    return appointments.filter((apt) => {
      return (
        apt.date.getMonth() === currentMonth &&
        apt.date.getFullYear() === currentYear
      );
    }).sort((a, b) => {
      if (a.date.getDate() !== b.date.getDate()) {
        return a.date.getDate() - b.date.getDate();
      }
      return a.time.localeCompare(b.time);
    });
  };

  const monthAppointments = getAppointmentsForMonth();

  return (
    <div className="aconselhamento-agenda">
      <div className="agenda-header">
        <button className="back-btn" onClick={onBack}>
          <FiChevronLeft /> Voltar
        </button>
        <h2>Agenda de Aconselhamento</h2>
      </div>

      <div className="agenda-content">
        <div className="calendar-container">
          <div className="calendar-header">
            <button className="nav-btn" onClick={prevMonth}>
              <FiChevronLeft />
            </button>
            <h3>
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button className="nav-btn" onClick={nextMonth}>
              <FiChevronRight />
            </button>
          </div>

          <div className="calendar-weekdays">
            {dayNames.map((day) => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {renderCalendarDays()}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot legend-today"></span>
              <span>Hoje</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-culto"></span>
              <span>Dia de Culto</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-appointment"></span>
              <span>Aconselhamento</span>
            </div>
          </div>
        </div>

        <div className="appointments-sidebar">
          <h3>
            <FiCalendar />
            Compromissos do Mês
          </h3>

          {monthAppointments.length === 0 ? (
            <div className="no-appointments">
              <FiCalendar />
              <p>Nenhum aconselhamento agendado para este mês.</p>
              <span>Clique em um dia no calendário para agendar.</span>
            </div>
          ) : (
            <div className="appointments-list">
              {monthAppointments.map((apt) => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-date-badge">
                    <span className="appointment-day">{apt.date.getDate()}</span>
                    <span className="appointment-month">{monthNames[apt.date.getMonth()].substring(0, 3)}</span>
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-name">
                      <FiUser />
                      <span>{apt.name}</span>
                    </div>
                    <div className="appointment-phone">
                      <FiPhone />
                      <span>{apt.phone || '-'}</span>
                    </div>
                    <div className="appointment-time">
                      <FiClock />
                      <span>{apt.time}</span>
                    </div>
                    {apt.notes && (
                      <p className="appointment-notes">{apt.notes}</p>
                    )}
                  </div>
                  <button 
                    className="cancel-appointment-btn" 
                    onClick={() => handleCancelAppointment(apt.id)}
                    title="Cancelar agendamento"
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        selectedDate={selectedDate}
        onSuccess={handleScheduleSuccess}
        unavailableTimes={selectedDate ? getTimesForDate(selectedDate) : []}
      />
    </div>
  );
}
