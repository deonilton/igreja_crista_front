import { Outlet } from 'react-router-dom';
import { BibleReadingProvider } from './BibleReadingContext';

/** Layout mínimo: provedor de versão da Bíblia + rotas filhas. */
export default function SalaPastoralOutlet() {
  return (
    <BibleReadingProvider>
      <Outlet />
    </BibleReadingProvider>
  );
}
