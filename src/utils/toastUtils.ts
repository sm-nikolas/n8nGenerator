import { toast, ToastOptions } from 'react-toastify';

// Cache para evitar toasts duplos
const activeToasts = new Map<string, number>();

// Configurações padrão para toasts
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Função para mostrar toast de erro sem duplicatas
export const showErrorToast = (message: string, key?: string) => {
  const toastKey = key || message;
  
  // Se já existe um toast ativo com a mesma mensagem, não mostrar outro
  if (activeToasts.has(toastKey)) {
    return;
  }
  
  // Mostrar o toast e armazenar o ID
  const toastId = toast.error(message, {
    ...defaultOptions,
    toastId: toastKey, // Evita duplicatas automaticamente
  });
  
  // Armazenar o ID do toast ativo
  activeToasts.set(toastKey, toastId);
  
  // Remover do cache quando o toast for fechado
  setTimeout(() => {
    activeToasts.delete(toastKey);
  }, 5000);
};

// Função para mostrar toast de sucesso sem duplicatas
export const showSuccessToast = (message: string, key?: string) => {
  const toastKey = key || message;
  
  // Se já existe um toast ativo com a mesma mensagem, não mostrar outro
  if (activeToasts.has(toastKey)) {
    return;
  }
  
  // Mostrar o toast e armazenar o ID
  const toastId = toast.success(message, {
    ...defaultOptions,
    toastId: toastKey, // Evita duplicatas automaticamente
  });
  
  // Armazenar o ID do toast ativo
  activeToasts.set(toastKey, toastId);
  
  // Remover do cache quando o toast for fechado
  setTimeout(() => {
    activeToasts.delete(toastKey);
  }, 5000);
};

// Função para mostrar toast de informação sem duplicatas
export const showInfoToast = (message: string, key?: string) => {
  const toastKey = key || message;
  
  // Se já existe um toast ativo com a mesma mensagem, não mostrar outro
  if (activeToasts.has(toastKey)) {
    return;
  }
  
  // Mostrar o toast e armazenar o ID
  const toastId = toast.info(message, {
    ...defaultOptions,
    toastId: toastKey, // Evita duplicatas automaticamente
  });
  
  // Armazenar o ID do toast ativo
  activeToasts.set(toastKey, toastId);
  
  // Remover do cache quando o toast for fechado
  setTimeout(() => {
    activeToasts.delete(toastKey);
  }, 5000);
};

// Função para limpar todos os toasts ativos
export const clearAllToasts = () => {
  activeToasts.clear();
  toast.dismiss();
};

// Função para limpar um toast específico
export const clearToast = (key: string) => {
  const toastId = activeToasts.get(key);
  if (toastId) {
    toast.dismiss(toastId);
    activeToasts.delete(key);
  }
};

// Exportar as funções padrão do toast para uso direto quando necessário
export { toast };
