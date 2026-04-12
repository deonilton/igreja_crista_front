import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { AxiosError } from 'axios';
import { authService } from '../../services/authService';
import '../Login/Login.css';
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
      <div className="login-page">
        <div className="login-container">
          <div className="login-image-section">
            <img
              src="/imagen/icf_logo.png"
              alt="Igreja Cristã da Família"
              className="login-image"
            />
            <h2>Igreja Cristã da Família</h2>
            <p>Bem-vindo ao nosso sistema de gestão Administrativo</p>
          </div>

          <div className="login-form-section">
            <div className="login-card">
              <div className="login-brand">
                <div className="forgot-success-icon" aria-hidden>
                  <FiCheckCircle size={28} />
                </div>
                <h1>Email enviado</h1>
                <p>
                  Enviamos as instruções para redefinir sua senha para{' '}
                  <strong>{email}</strong>.
                </p>
                <p className="forgot-secondary-text">
                  Verifique sua caixa de entrada e a pasta de spam. O link expira em 1 hora.
                </p>
              </div>

              <div className="forgot-password-link">
                <Link to="/login" className="forgot-back-link">
                  <FiArrowLeft size={16} aria-hidden />
                  Voltar para o login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-image-section">
          <img
            src="/imagen/icf_logo.png"
            alt="Igreja Cristã da Família"
            className="login-image"
          />
          <h2>Igreja Cristã da Família</h2>
          <p>Bem-vindo ao nosso sistema de gestão Administrativo</p>
        </div>

        <div className="login-form-section">
          <div className="login-card">
            <div className="login-brand">
              <div className="login-brand-icon" aria-hidden>
                <FiMail size={24} />
              </div>
              <h1>Esqueci minha senha</h1>
              <p>Digite seu email abaixo e enviaremos um link para redefinir sua senha.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

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

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>

            <div className="forgot-password-link">
              <Link to="/login" className="forgot-back-link">
                <FiArrowLeft size={16} aria-hidden />
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
