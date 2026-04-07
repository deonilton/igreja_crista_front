import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBookOpen, FiImage, FiEye, FiEyeOff } from 'react-icons/fi';
import { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import type { ApiError } from '../../types';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.error;
      
      // Mensagens amigáveis para diferentes tipos de erro
      if (errorMessage?.includes('Email não encontrado')) {
        setError('Email não encontrado. Verifique se o email está correto ou cadastre-se.');
      } else if (errorMessage?.includes('Senha incorreta')) {
        setError('Senha incorreta. Tente novamente ou clique em "Esqueci minha senha".');
      } else if (errorMessage?.includes('obrigatórios')) {
        setError('Por favor, preencha todos os campos.');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente em alguns instantes.');
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
          <img src="/imagen/icf_logo.png" alt="Igreja Cristã Familiar" className="login-image" />
          
          <h2>Igreja Cristã Familiar</h2>
          <p>Bem-vindo ao nosso sistema de gestão</p>
        </div>

        {/* Seção do Formulário */}
        <div className="login-form-section">
          <div className="login-card">
            <div className="login-brand">
             
              <h1>ICF - Aparecida/SP</h1>
              <p>Acesse o painel administrativo</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && <div className="login-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="admin@igreja.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Limpar erro ao digitar
                  }}
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(''); // Limpar erro ao digitar
                    }}
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
