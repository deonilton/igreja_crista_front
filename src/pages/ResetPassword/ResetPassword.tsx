import { FormEvent, useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { AxiosError } from 'axios';
import { authService } from '../../services/authService';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token de redefinição não encontrado. Solicite uma nova recuperação de senha.');
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!token) {
      setError('Token inválido. Solicite uma nova recuperação de senha.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      const errorMessage = axiosError.response?.data?.error;
      
      setError(
        errorMessage || 
        'Ocorreu um erro ao redefinir sua senha. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === false) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-header">
              <div className="error-icon">
                <FiAlertCircle />
              </div>
              <h1>Token Inválido</h1>
              <p>
                O link de redefinição de senha é inválido ou expirou.
              </p>
              <p>
                Por favor, solicite uma nova recuperação de senha.
              </p>
            </div>

            <div className="reset-password-actions">
              <Link to="/forgot-password" className="back-link">
                Solicitar Nova Recuperação
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-header">
              <div className="success-icon">
                <FiCheck />
              </div>
              <h1>Senha Redefinida!</h1>
              <p>
                Sua senha foi redefinida com sucesso.
              </p>
              <p className="instruction">
                Você já pode fazer login com sua nova senha.
              </p>
            </div>

            <div className="reset-password-actions">
              <Link to="/login" className="login-link">
                Fazer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <div className="reset-password-icon">
              <FiLock />
            </div>
            <h1>Redefinir Senha</h1>
            <p>
              Digite sua nova senha abaixo.
            </p>
          </div>

          <form className="reset-password-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="newPassword">Nova Senha</label>
              <input
                id="newPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <small className="form-hint">
                Mínimo de 6 caracteres
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>

          <div className="reset-password-actions">
            <Link to="/login" className="back-link">
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
