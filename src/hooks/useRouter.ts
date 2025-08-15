import { useState, useEffect, useCallback } from 'react';

export type ViewType = 'chat' | 'workflow' | 'preview';

interface RouterState {
  workflowId: string | null;
  view: ViewType;
}

export function useRouter() {
  const [state, setState] = useState<RouterState>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('workflow');
    const view = urlParams.get('view') as ViewType;
    
    let validView: ViewType = 'chat';
    let validWorkflowId: string | null = null;
    
    if (['chat', 'workflow', 'preview'].includes(view)) {
      validView = view;
    }
    
    if (workflowId && workflowId.trim().length > 0) {
      validWorkflowId = workflowId;
      if (validView === 'workflow' || validView === 'preview') {
        // View válido para workflow
      } else {
        validView = 'chat';
      }
    } else {
      validView = 'chat';
    }
    
    // Garantir que a URL esteja sempre sincronizada com o estado
    const currentParams = new URLSearchParams(window.location.search);
    const needsUpdate = 
      currentParams.get('workflow') !== validWorkflowId ||
      currentParams.get('view') !== validView;
    
    if (needsUpdate) {
      const newUrl = new URL(window.location.href);
      if (validWorkflowId) {
        newUrl.searchParams.set('workflow', validWorkflowId);
      } else {
        newUrl.searchParams.delete('workflow');
      }
      
      newUrl.searchParams.set('view', validView);
      
      // Usar replaceState para garantir que a URL seja atualizada
      window.history.replaceState(
        { workflowId: validWorkflowId, view: validView },
        '',
        newUrl.toString()
      );
    }
    
    return {
      workflowId: validWorkflowId,
      view: validView
    };
  });

  const navigate = useCallback((
    workflowId: string | null, 
    view: ViewType
  ) => {
    const url = new URL(window.location.href);
    
    if (workflowId) {
      url.searchParams.set('workflow', workflowId);
    } else {
      url.searchParams.delete('workflow');
    }
    
    url.searchParams.set('view', view);
    
    // Usar replaceState para evitar entradas desnecessárias no histórico
    window.history.replaceState(
      { workflowId, view },
      '',
      url.toString()
    );
    
    setState({ workflowId, view });
  }, []);

  // Função para forçar atualização da URL sem mudar o estado
  const updateUrl = useCallback((
    workflowId: string | null, 
    view: ViewType
  ) => {
    const url = new URL(window.location.href);
    
    if (workflowId) {
      url.searchParams.set('workflow', workflowId);
    } else {
      url.searchParams.delete('workflow');
    }
    
    url.searchParams.set('view', view);
    
    // Atualizar apenas a URL, não o estado
    window.history.replaceState(
      { workflowId, view },
      '',
      url.toString()
    );
  }, []);

  const navigateToView = useCallback((view: ViewType) => {
    if (state.workflowId) {
      navigate(state.workflowId, view);
    } else if (view === 'chat') {
      navigate(null, 'chat');
    }
  }, [state.workflowId, navigate]);

  const navigateToWorkflow = useCallback((workflowId: string, view: ViewType = 'chat') => {
    navigate(workflowId, view);
  }, [navigate]);

  const navigateToNewChat = useCallback(() => {
    navigate(null, 'chat');
  }, [navigate]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setState(event.state);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const workflowId = urlParams.get('workflow');
        const view = urlParams.get('view') as ViewType;
        
        let validView: ViewType = 'chat';
        let validWorkflowId: string | null = null;
        
        if (['chat', 'workflow', 'preview'].includes(view)) {
          validView = view;
        }
        
        if (workflowId && workflowId.trim().length > 0) {
          validWorkflowId = workflowId;
          if (validView === 'workflow' || validView === 'preview') {
            // View válido para workflow
          } else {
            validView = 'chat';
          }
        } else {
          validView = 'chat';
        }
        
        setState({
          workflowId: validWorkflowId,
          view: validView
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const resetToDefault = useCallback(() => {
    navigate(null, 'chat');
  }, [navigate]);

  return {
    workflowId: state.workflowId,
    view: state.view,
    navigate,
    navigateToView,
    navigateToWorkflow,
    navigateToNewChat,
    resetToDefault,
    updateUrl
  };
}
