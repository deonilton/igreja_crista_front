import { Link } from 'react-router-dom';
import './Forbidden.css';

export default function Forbidden() {
  return (
    <div className="forbidden-page">
      <div className="forbidden-card">
        <p className="forbidden-code">403</p>
        <h1>Acesso negado</h1>
        <p>Você não tem permissão para acessar este recurso.</p>
        <Link to="/" className="forbidden-action">
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
