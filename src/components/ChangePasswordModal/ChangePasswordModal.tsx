import { useState, FormEvent } from 'react';
import { FiX, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { AxiosError } from 'axios';
import { authService } from '../../services/authService';
import './ChangePasswordModal.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  general?: string;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Digite sua senha atual.';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Digite a nova senha.';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'A nova senha deve ter pelo menos 6 caracteres.';
    }

    if (!confirmNewPassword.trim()) {
      newErrors.confirmNewPassword = 'Confirme a nova senha.';
    } else if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = 'As senhas não coincidem.';
    }

    if (newPassword === currentPassword && newPassword) {
      newErrors.newPassword = 'A nova senha deve ser diferente da atual.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      const errorMessage = axiosError.response?.data?.error;

      if (errorMessage?.includes('Senha atual incorreta')) {
        setErrors({ currentPassword: 'Senha atual incorreta.' });
      } else if (errorMessage?.includes('coincidem')) {
        setErrors({ confirmNewPassword: 'As senhas não coincidem.' });
      } else if (errorMessage?.includes('pelo menos 6 caracteres')) {
        setErrors({ newPassword: 'A senha deve ter pelo menos 6 caracteres.' });
      } else if (errorMessage?.includes('diferente da senha atual')) {
        setErrors({ newPassword: 'A nova senha deve ser diferente da atual.' });
      } else {
        setErrors({ general: errorMessage || 'Erro ao alterar senha. Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setErrors({});
      setSuccess(false);
      onClose();
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            <FiLock />
          </div>
          <h2>Alterar Senha</h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={loading}
            type="button"
          >
            <FiX />
          </button>
        </div>

        {success ? (
          <div className="modal-success">
            <div className="success-icon">
              <FiCheck />
            </div>
            <h3>Senha Alterada!</h3>
            <p>Sua senha foi atualizada com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {errors.general && (
              <div className="error-banner">
                <FiAlertCircle />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="currentPassword">Senha Atual</label>
              <div className="password-input-wrapper">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={errors.currentPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="field-error">{errors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Nova Senha</label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={errors.newPassword ? 'error' : ''}
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.newPassword ? (
                <span className="field-error">{errors.newPassword}</span>
              ) : (
                <small className="form-hint">Mínimo de 6 caracteres</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirmar Nova Senha</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={errors.confirmNewPassword ? 'error' : ''}
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <span className="field-error">{errors.confirmNewPassword}</span>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
