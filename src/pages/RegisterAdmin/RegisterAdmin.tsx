import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import axios, { AxiosError } from 'axios';
import type { ApiError } from '../../types';
import { showSuccess, showError } from '../../utils/swalConfig';
import './RegisterAdmin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'super_admin',
    ministries: [] as string[],
  });

  const availableMinistries = [
    { id: 'pequenas_familias', label: 'Pequenas Famílias' },
    { id: 'evangelismo', label: 'Evangelismo e Missões' },
    { id: 'diaconia', label: 'Diaconia' },
    { id: 'louvor', label: 'Louvor' },
    { id: 'ministerio_infantil', label: 'Ministério Infantil' },
    { id: 'membros', label: 'Membros da ICF' },
  ];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleMinistryToggle(ministryId: string) {
    setFormData(prev => ({
      ...prev,
      ministries: prev.ministries.includes(ministryId)
        ? prev.ministries.filter(m => m !== ministryId)
        : [...prev.ministries, ministryId]
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/public/register-admin`, formData);
      await showSuccess('Administrador cadastrado com sucesso! Faça login para acessar o sistema.');
      navigate('/login');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      void showError(axiosError.response?.data?.error || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-admin-page">
      <div className="register-admin-card">
        <button 
          type="button" 
          className="back-btn"
          onClick={() => navigate('/login')}
        >
          <FiArrowLeft /> Voltar ao Login
        </button>

        <div className="register-admin-brand">
          <div className="register-admin-brand-icon">
            <FiBookOpen />
          </div>
          <h1>Cadastro de Administrador</h1>
          <p>Crie sua conta para acessar o painel administrativo</p>
        </div>

        <form className="register-admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="João da Silva"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="admin@igreja.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Tipo de Acesso</label>
            <select
              id="role"
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="super_admin">Super Admin (Acesso Total)</option>
              <option value="admin">Admin (Acesso a Ministérios Selecionados)</option>
              <option value="colaborador">Colaborador (Acesso Limitado)</option>
            </select>
          </div>

          {(formData.role === 'admin' || formData.role === 'colaborador') && (
            <div className="form-group">
              <label>Ministérios com Acesso</label>
              <div className="ministries-checkboxes">
                {availableMinistries.map(ministry => (
                  <label key={ministry.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.ministries.includes(ministry.id)}
                      onChange={() => handleMinistryToggle(ministry.id)}
                    />
                    <span>{ministry.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="register-admin-btn"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Criar Conta de Administrador'}
          </button>
        </form>
      </div>
    </div>
  );
}
