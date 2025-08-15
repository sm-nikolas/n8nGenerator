import { useState, useCallback } from 'react';
import { Workflow } from '../types'; // Removido Conversation
import { useRouter, ViewType } from './useRouter';

interface AppState {
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  sidebarOpen: boolean;
  showAuthModal: boolean;
}

export function useAppState() {
  const { workflowId, view, navigateToView, navigateToWorkflow, resetToDefault } = useRouter();
  
  const [state, setState] = useState<AppState>({
    currentWorkflow: null,
    isLoading: false,
    sidebarOpen: true,
    showAuthModal: false,
  });

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleSidebar = useCallback(() => {
    updateState({ sidebarOpen: !state.sidebarOpen });
  }, [state.sidebarOpen, updateState]);

  const setAuthModal = useCallback((show: boolean) => {
    updateState({ showAuthModal: show });
  }, [updateState]);

  const setCurrentWorkflow = useCallback((workflow: Workflow | null) => {
    // Salvar no localStorage
    if (workflow) {
      localStorage.setItem('activeWorkflowId', workflow.id);
    } else {
      localStorage.removeItem('activeWorkflowId');
    }
    
    updateState({ currentWorkflow: workflow });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ isLoading: loading });
  }, [updateState]);

  const resetAppState = useCallback(() => {
    // Limpar localStorage e estado
    localStorage.removeItem('activeWorkflowId');
    setCurrentWorkflow(null);
    resetToDefault();
  }, [setCurrentWorkflow, resetToDefault]);

  const navigateToWorkflowHandler = useCallback((workflow: Workflow, view: ViewType = 'chat') => {
    setCurrentWorkflow(workflow);
    navigateToWorkflow(workflow.id, view);
  }, [setCurrentWorkflow, navigateToWorkflow]);

  const navigateToNewChatHandler = useCallback(() => {
    // Limpar localStorage e estado para novo chat
    localStorage.removeItem('activeWorkflowId');
    setCurrentWorkflow(null);
    resetToDefault();
  }, [setCurrentWorkflow, resetToDefault]);

  const navigateToViewHandler = useCallback((newView: ViewType) => {
    if (state.currentWorkflow) {
      navigateToView(newView);
    } else if (newView === 'chat') {
      resetToDefault();
    }
  }, [state.currentWorkflow, navigateToView, resetToDefault]);



  return {
    currentWorkflow: state.currentWorkflow,
    isLoading: state.isLoading,
    sidebarOpen: state.sidebarOpen,
    showAuthModal: state.showAuthModal,
    view,
    workflowId,
    
    updateState,
    toggleSidebar,
    setAuthModal,
    setCurrentWorkflow,
    setLoading,
    resetAppState,
    navigateToWorkflow: navigateToWorkflowHandler,
    navigateToNewChat: navigateToNewChatHandler,
    navigateToView: navigateToViewHandler,
    
    resetToDefault,
  };
}
