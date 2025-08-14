import { useState, useCallback, useEffect } from 'react';
import { Workflow } from '../types';
import { useRouter, ViewType } from './useRouter';

interface AppState {
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  sidebarOpen: boolean;
  showAuthModal: boolean;
}

export function useAppState() {
  const { workflowId, view, navigateToView, navigateToWorkflow, navigateToNewChat } = useRouter();
  
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
    navigateToNewChat();
  }, [setCurrentWorkflow, navigateToNewChat]);

  // Função para navegar para um workflow específico
  const navigateToWorkflowHandler = useCallback((workflow: Workflow, view: ViewType = 'chat') => {
    setCurrentWorkflow(workflow);
    navigateToWorkflow(workflow.id, view);
  }, [setCurrentWorkflow, navigateToWorkflow]);

  // Função para navegar para uma nova conversa
  const navigateToNewChatHandler = useCallback(() => {
    setCurrentWorkflow(null);
    navigateToNewChat();
  }, [setCurrentWorkflow, navigateToNewChat]);

  // Função para navegar para uma view específica
  const navigateToViewHandler = useCallback((newView: ViewType) => {
    if (state.currentWorkflow) {
      navigateToView(newView);
    } else if (newView === 'chat') {
      navigateToNewChat();
    }
  }, [state.currentWorkflow, navigateToView, navigateToNewChat]);

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
    navigateToWorkflow: navigateToWorkflowHandler,
    navigateToNewChat: navigateToNewChatHandler,
    navigateToView: navigateToViewHandler,
  };
}
