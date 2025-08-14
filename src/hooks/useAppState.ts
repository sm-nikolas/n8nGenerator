import { useState, useCallback, useEffect } from 'react';
import { Workflow, Conversation } from '../types';
import { useRouter } from './useRouter';

interface AppState {
  currentWorkflow: Workflow | null;
  currentConversation: Conversation | null;
  isLoading: boolean;
  sidebarOpen: boolean;
  showAuthModal: boolean;
}

export function useAppState() {
  const { workflowId, conversationId, view, navigate, resetToDefault } = useRouter();
  
  const [state, setState] = useState<AppState>({
    currentWorkflow: null,
    currentConversation: null,
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

  // Função para definir a conversa atual
  const setCurrentConversation = useCallback((conversation: Conversation | null) => {
    updateState({ currentConversation: conversation });
  }, [updateState]);
  // Função para definir o estado de carregamento
  const setLoading = useCallback((loading: boolean) => {
    updateState({ isLoading: loading });
  }, [updateState]);

  // Função para resetar o estado da aplicação
  const resetAppState = useCallback(() => {
    setCurrentWorkflow(null);
    setCurrentConversation(null);
    resetToDefault();
  }, [setCurrentWorkflow, setCurrentConversation, resetToDefault]);

  // Função para navegar para um workflow específico
  const navigateToWorkflow = useCallback((workflow: Workflow, view: 'chat' | 'workflow' | 'preview' = 'chat') => {
    setCurrentWorkflow(workflow);
    setCurrentConversation(null);
    navigate(workflow.id, view);
  }, [setCurrentWorkflow, setCurrentConversation, navigate]);

  // Função para navegar para uma conversa específica
  const navigateToConversation = useCallback((conversation: Conversation, view: 'chat' | 'workflow' | 'preview' = 'chat') => {
    setCurrentConversation(conversation);
    setCurrentWorkflow(null);
    navigate(null, view, conversation.id);
  }, [setCurrentConversation, setCurrentWorkflow, navigate]);
  // Função para navegar para uma nova conversa
  const navigateToNewChat = useCallback(() => {
    setCurrentWorkflow(null);
    setCurrentConversation(null);
    resetToDefault();
  }, [setCurrentWorkflow, setCurrentConversation, resetToDefault]);

  // Função para navegar para uma view específica
  const navigateToView = useCallback((newView: 'chat' | 'workflow' | 'preview') => {
    if (state.currentWorkflow) {
      navigate(state.currentWorkflow.id, newView);
    } else if (state.currentConversation) {
      navigate(null, newView, state.currentConversation.id);
    } else if (newView === 'chat') {
      resetToDefault();
    }
  }, [state.currentWorkflow, state.currentConversation, navigate, resetToDefault]);

  // Sincronizar o estado com o roteamento
  useEffect(() => {
    // Se não há workflowId na URL, garantir que o estado está limpo
    if (!workflowId && state.currentWorkflow) {
      setCurrentWorkflow(null);
    }
    
    // Se não há conversationId na URL, garantir que o estado está limpo
    if (!conversationId && state.currentConversation) {
      setCurrentConversation(null);
    }
  }, [workflowId, conversationId, state.currentWorkflow, state.currentConversation, setCurrentWorkflow, setCurrentConversation]);

  return {
    // Estado
    currentWorkflow: state.currentWorkflow,
    currentConversation: state.currentConversation,
    isLoading: state.isLoading,
    sidebarOpen: state.sidebarOpen,
    showAuthModal: state.showAuthModal,
    view,
    workflowId,
    conversationId,
    
    // Ações
    updateState,
    toggleSidebar,
    setAuthModal,
    setCurrentWorkflow,
    setCurrentConversation,
    setLoading,
    resetAppState,
    navigateToWorkflow,
    navigateToConversation,
    navigateToNewChat,
    navigateToView,
    
    // Funções do router
    navigate,
    resetToDefault,
  };
}
