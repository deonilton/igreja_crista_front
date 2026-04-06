import { useState, useEffect } from 'react';
import { FiFileText, FiCalendar, FiUsers, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Button from '../../components/Button/Button';
import './RelatorioCulto.css';

export default function RelatorioCulto() {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());

  // Função para obter o domingo da semana atual
  const getSundayOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Função para formatar a data
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para obter o intervalo da semana
  const getWeekRange = (date: Date): string => {
    const sunday = getSundayOfWeek(new Date(date));
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    
    return `${formatDate(sunday)} - ${formatDate(saturday)}`;
  };

  // Navegar para a semana anterior
  const previousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  // Navegar para a próxima semana
  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  // Voltar para a semana atual
  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  return (
    <div className="relatorio-culto">
      <div className="relatorio-culto-header">
        <h1>Relatório de Culto</h1>
        <p>Gerencie e visualize os relatórios dos cultos da igreja</p>
      </div>

      <div className="relatorio-culto-content">
        {/* Barra de navegação de semanas */}
        <div className="week-navigation">
          <div className="week-nav-header">
            <h3>Período do Relatório</h3>
            <button className="btn-current-week" onClick={goToCurrentWeek}>
              Semana Atual
            </button>
          </div>
          <div className="week-nav-controls">
            <button className="week-nav-btn" onClick={previousWeek}>
              <FiChevronLeft />
            </button>
            <div className="week-display">
              <div className="week-range">{getWeekRange(currentWeek)}</div>
              <div className="week-sunday">
                Domingo: {formatDate(getSundayOfWeek(currentWeek))}
              </div>
            </div>
            <button className="week-nav-btn" onClick={nextWeek}>
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="relatorio-culto-actions">
          <Button variant="primary" size="md" icon={<FiFileText />}>
            Novo Relatório
          </Button>
          <Button variant="secondary" size="md" icon={<FiDownload />}>
            Exportar Relatórios
          </Button>
        </div>

        <div className="relatorio-culto-stats">
          <div className="stat-card">
            <div className="stat-icon primary">
              <FiCalendar />
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Cultos este mês</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <FiUsers />
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Total de Participantes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <FiFileText />
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Relatórios Gerados</p>
            </div>
          </div>
        </div>

        <div className="relatorio-culto-list">
          <div className="relatorio-culto-list-header">
            <h2>Relatórios Recentes</h2>
          </div>
          
          <div className="empty-state">
            <FiFileText />
            <h3>Nenhum relatório encontrado</h3>
            <p>Comece criando um novo relatório de culto</p>
          </div>
        </div>
      </div>
    </div>
  );
}
