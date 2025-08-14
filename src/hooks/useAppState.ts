import { useState, useCallback, useEffect } from 'react';
import { Workflow } from '../types';
import { useRouter } from './useRouter';

interface AppState {
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  sidebarOpen: boolean;
  showAuthModal: boolean;
}

export function useAppState() {
  const { workflowId, view, navigate, resetToDefault } = useRouter();
  
  const [state, setState] = useState<AppState>({
    currentWorkflow: null,
    isLoading: false,
    sidebarOpen: true,
    showAuthModal: false,
  });

  // Função para atualizar o estado de forma segura
  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Função para alternar a sidebar
  const toggleSidebar = useCallback(() => {
    updateState({ sidebarOpen: !state.sidebarOpen });
  }, [state.sidebarOpen, updateState]);

  // Função para abrir/fechar o modal de autenticação
  const setAuthModal = useCallback((isOpen: boolean) => {
    updateState({ showAuthModal: isOpen });
  }, [updateState]);

  // Função para definir o workflow atual
  const setCurrentWorkflow = useCallback((workflow: Workflow | null) => {
    updateState({ currentWorkflow: workflow });
  }, [updateState]);

  // Função para definir o estado de carregamento
  const setLoading = useCallback((loading: boolean) => {
    updateState({ isLoading: loading });
  }, [updateState]);

  // Função para resetar o estado da aplicação
  const resetAppState = useCallback(() => {
    setCurrentWorkflow(null);
    resetToDefault();
  }, [setCurrentWorkflow, resetToDefault]);

  // Função para navegar para um workflow específico
  const navigateToWorkflow = useCallback((workflow: Workflow, view: 'chat' | 'workflow' | 'preview' = 'chat') => {
    setCurrentWorkflow(workflow);
    navigate(workflow.id, view);
  }, [setCurrentWorkflow, navigate]);

  // Função para navegar para uma nova conversa
  const navigateToNewChat = useCallback(() => {
    setCurrentWorkflow(null);
    resetToDefault();
  }, [setCurrentWorkflow, resetToDefault]);

  // Função para navegar para uma view específica
  const navigateToView = useCallback((newView: 'chat' | 'workflow' | 'preview') => {
    if (state.currentWorkflow) {
      navigate(state.currentWorkflow.id, newView);
    } else if (newView === 'chat') {
      resetToDefault();
    }
  }, [state.currentWorkflow, navigate, resetToDefault]);

  // Sincronizar o estado com o roteamento
  useEffect(() => {
    // Se não há workflowId na URL, garantir que o estado está limpo
    if (!workflowId && state.currentWorkflow) {
      setCurrentWorkflow(null);
    }
  }, [workflowId, state.currentWorkflow, setCurrentWorkflow]);

  return {
    // Estado
    currentWorkflow: state.currentWorkflow,
    isLoading: state.isLoading,
    sidebarOpen: state.sidebarOpen,
    showAuthModal: state.showAuthModal,
    view,
    workflowId,
    
    // Ações
    updateState,
    toggleSidebar,
    setAuthModal,
    setCurrentWorkflow,
    setLoading,
    resetAppState,
    navigateToWorkflow,
    navigateToNewChat,
    navigateToView,
    
    // Funções do router
    navigate,
    resetToDefault,
  };
}
