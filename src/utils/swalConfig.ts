import Swal from 'sweetalert2';

// Configuração base do SweetAlert2
const baseConfig = {
  customClass: {
    popup: 'swal-popup',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
    actions: 'swal-actions',
  },
  buttonsStyling: false,
  background: '#FFFFFF',
  showClass: {
    popup: 'swal-show',
  },
  hideClass: {
    popup: 'swal-hide',
  },
};

// Instância padrão do Swal
export default Swal.mixin(baseConfig);

// Helper: Alerta de Sucesso
export const showSuccess = (message: string, title: string = 'Sucesso!') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true,
  });
};

// Helper: Alerta de Erro
export const showError = (message: string, title: string = 'Erro!') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
};

// Helper: Alerta de Aviso
export const showWarning = (message: string, title: string = 'Atenção!') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
};

// Helper: Alerta de Informação
export const showInfo = (message: string, title: string = 'Informação') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
};

// Helper: Confirmação
export const showConfirm = (
  message: string,
  title: string = 'Confirmar ação?',
  confirmText: string = 'Sim',
  cancelText: string = 'Cancelar'
) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
};

// Helper: Confirmação de Exclusão
export const showDeleteConfirm = (
  itemName: string = 'este item',
  message?: string
) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title: 'Confirmar exclusão?',
    text: message || `Tem certeza que deseja excluir ${itemName}? Esta ação não pode ser desfeita.`,
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'swal-confirm-btn swal-danger-btn',
    },
  });
};

// Helper: Confirmação de Logout
export const showLogoutConfirm = (message: string) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title: 'Confirmar saída?',
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Sair',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });
};
