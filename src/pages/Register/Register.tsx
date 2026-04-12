import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen, FiArrowLeft } from 'react-icons/fi';
import axios, { AxiosError } from 'axios';
import type { ApiError } from '../../types';
import { showSuccess, showError } from '../../utils/swalConfig';
import './Register.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/public/members`, formData);
      await showSuccess('Cadastro realizado com sucesso! Aguarde o contato da igreja.');
      navigate('/login');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      void showError(axiosError.response?.data?.error || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <button 
          type="button" 
          className="back-btn"
          onClick={() => navigate('/login')}
        >
          <FiArrowLeft /> Voltar ao Login
        </button>

        <div className="register-brand">
          <div className="register-brand-icon">
            <FiBookOpen />
          </div>
          <h1>Cadastro de Membro</h1>
          <p>Preencha seus dados para se cadastrar</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full_name">Nome Completo *</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className="form-input"
                placeholder="João da Silva"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="joao@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefone *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="birth_date">Data de Nascimento</label>
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                className="form-input"
                value={formData.birth_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gênero</label>
              <select
                id="gender"
                name="gender"
                className="form-input"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address">Endereço</label>
              <input
                id="address"
                name="address"
                type="text"
                className="form-input"
                placeholder="Rua, número"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Cidade</label>
              <input
                id="city"
                name="city"
                type="text"
                className="form-input"
                placeholder="São Paulo"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">Estado</label>
              <input
                id="state"
                name="state"
                type="text"
                className="form-input"
                placeholder="SP"
                maxLength={2}
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="zip_code">CEP</label>
              <input
                id="zip_code"
                name="zip_code"
                type="text"
                className="form-input"
                placeholder="00000-000"
                value={formData.zip_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="register-btn"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
