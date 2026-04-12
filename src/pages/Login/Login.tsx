import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import type { ApiError } from '../../types';
import { showError, showLoginWelcome } from '../../utils/swalConfig';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      await showLoginWelcome(loggedUser.name);
      navigate('/');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const status = axiosError.response?.status;
      const errorMessage = axiosError.response?.data?.error ?? '';

      const isInvalidCredentials =
        status === 401 ||
        errorMessage === 'Credenciais inválidas.' ||
        errorMessage.includes('Email não encontrado') ||
        errorMessage.includes('Senha incorreta');

      if (isInvalidCredentials) {
        await showError(
          'Email ou senha incorretos. Verifique os dados ou use "Esqueci minha senha" para recuperar o acesso.',
          'Não foi possível entrar'
        );
      } else if (errorMessage.includes('obrigatórios')) {
        await showError('Por favor, preencha email e senha.', 'Campos obrigatórios');
      } else {
        await showError(
          errorMessage ||
            'Ocorreu um erro ao fazer login. Tente novamente em alguns instantes.',
          'Erro no login'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // Verifica se existe imagem da igreja
  const churchImage = '/images/igreja.jpg';

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Seção da Imagem */}
        <div className="login-image-section">
          {/* Logo da Igreja */}
          <img src="/imagen/icf_logo.png" alt="Igreja Cristã da Família" className="login-image" />
          
          <h2>Igreja Cristã da Família</h2>
          <p>Bem-vindo ao nosso sistema de gestão Administrativo</p>
        </div>

        {/* Seção do Formulário */}
        <div className="login-form-section">
          <div className="login-card">
            <div className="login-brand">
             
              <h1>ICF - Aparecida/SP</h1>
              <p>Acesse o painel administrativo</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="admin@igreja.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Senha</label>
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input password-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={0}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="forgot-password-link">
                <Link to="/forgot-password">
                  Esqueci minha senha
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
