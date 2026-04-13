import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/membros': 'Membros',
  '/membros/novo': 'Novo Membro',
  '/usuarios': 'Usuários',
  '/pequenas-familias': 'Pequenas Famílias',
  '/evangelismo': 'Evangelismo e Missões - Casa de Paz',
  '/diaconia': 'Diaconia',
  '/louvor': 'Louvor',
  '/ministerio-infantil': 'Ministério Infantil',
  '/relatorio-culto': 'Relatório de Culto',
  '/sala-pastoral': 'Estudos Bíblicos',
  '/sala-pastoral/painel': 'Sala Pastoral',
};

export default function Layout() {
  const location = useLocation();

  const getTitle = (): string => {
    let baseTitle = 'Painel';
    const { pathname } = location;
    if (pathname.match(/^\/membros\/\d+\/editar$/)) {
      baseTitle = 'Editar Membro';
    } else if (pathname.startsWith('/sala-pastoral/livro/') && pathname.includes('/capitulo/')) {
      baseTitle = 'Leitura bíblica';
    } else if (pathname.match(/^\/sala-pastoral\/livro\//)) {
      baseTitle = 'Capítulos';
    } else if (pageTitles[pathname]) {
      baseTitle = pageTitles[pathname];
    }
    return `Igreja Cristã da Família - ${baseTitle}`;
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header-title">{getTitle()}</h1>
          <span className="app-header-time">{dateStr}</span>
        </header>
        <main className="app-content fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
