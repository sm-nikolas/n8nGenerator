import { useState, useEffect, useCallback } from 'react';

export type ViewType = 'chat' | 'workflow' | 'preview';

interface RouterState {
  workflowId: string | null;
  view: ViewType;
}

export function useRouter() {
  const [state, setState] = useState<RouterState>(() => {
    // Inicializar estado a partir da URL
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('workflow');
    const view = urlParams.get('view') as ViewType;
    
    // Validar e normalizar parâmetros
    let validView: ViewType = 'chat';
    let validWorkflowId: string | null = null;
    
    if (['chat', 'workflow', 'preview'].includes(view)) {
      validView = view;
    }
    
    if (workflowId && workflowId.trim().length > 0) {
      validWorkflowId = workflowId;
      
      // Se há workflowId mas view não é válida para workflow, resetar para chat
      if (validView === 'workflow' || validView === 'preview') {
        // View válida para workflow
      } else {
        validView = 'chat';
      }
    } else {
      // Sem workflowId, apenas chat é válido
      validView = 'chat';
    }
    
    // Atualizar URL se necessário
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

  const navigate = useCallback((workflowId: string | null, view: ViewType) => {
    const url = new URL(window.location.href);
    
    if (workflowId) {
      url.searchParams.set('workflow', workflowId);
    } else {
      url.searchParams.delete('workflow');
    }
    
    url.searchParams.set('view', view);
    
    // Usar pushState para navegação
    window.history.pushState(
      { workflowId, view },
      '',
      url.toString()
    );
    
    setState({ workflowId, view });
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

  // Escutar mudanças na URL (navegação do browser)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setState(event.state);
      } else {
        // Fallback para quando não há state (ex: refresh da página)
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
            // View válida para workflow
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

  return {
    workflowId: state.workflowId,
    view: state.view,
    navigate,
    navigateToView,
    navigateToWorkflow,
    navigateToNewChat
  };
}
