import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { AxiosError } from 'axios';
import { authService } from '../../services/authService';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      const errorMessage = axiosError.response?.data?.error;
      
      setError(
        errorMessage || 
        'Ocorreu um erro ao enviar o email. Tente novamente em alguns instantes.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="forgot-password-card">
            <div className="forgot-password-header">
              <div className="success-icon">
                <FiMail />
              </div>
              <h1>Email Enviado!</h1>
              <p>
                Enviamos as instruções para redefinir sua senha para o email <strong>{email}</strong>.
              </p>
              <p className="instruction">
                Verifique sua caixa de entrada e a pasta de spam. O link expira em 1 hora.
              </p>
            </div>

            <div className="forgot-password-actions">
              <Link to="/login" className="back-link">
                <FiArrowLeft />
                Voltar para o Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <div className="forgot-password-icon">
              <FiMail />
            </div>
            <h1>Esqueci minha Senha</h1>
            <p>
              Digite seu email abaixo e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form className="forgot-password-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>

          <div className="forgot-password-actions">
            <Link to="/login" className="back-link">
              <FiArrowLeft />
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
