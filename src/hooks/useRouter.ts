import { useState, useEffect, useCallback } from 'react';
import { Workflow } from '../types';
import { validateURLParams, normalizeURL, createNewChatURL } from '../utils/urlValidation';

interface RouterState {
  workflowId: string | null;
  view: 'chat' | 'workflow' | 'preview';
}

export function useRouter() {
  const [state, setState] = useState<RouterState>(() => {
    // Inicializar estado a partir da URL
    const currentURL = window.location.href;
    const validation = validateURLParams(currentURL);
    
    // Se a URL não é válida, normalizar e definir estado padrão
    if (!validation.isValid) {
      const normalizedURL = normalizeURL(currentURL);
      window.history.replaceState({ workflowId: null, view: 'chat' }, '', normalizedURL);
      
      return {
        workflowId: null,
        view: 'chat'
      };
    }
    
    // Se não há parâmetros na URL, definir estado padrão de novo chat
    if (!validation.workflowId && !validation.view) {
      const newChatURL = createNewChatURL(currentURL);
      window.history.replaceState({ workflowId: null, view: 'chat' }, '', newChatURL);
      
      return {
        workflowId: null,
        view: 'chat'
      };
    }
    
    // Se há workflow mas não há view, definir view como 'chat'
    if (validation.workflowId && !validation.view) {
      const url = new URL(currentURL);
      url.searchParams.set('view', 'chat');
      window.history.replaceState({ workflowId: validation.workflowId, view: 'chat' }, '', url.toString());
      
      return {
        workflowId: validation.workflowId,
        view: 'chat'
      };
    }
    
    // Se há view mas não há workflow, definir workflowId como null
    if (!validation.workflowId && validation.view) {
      const url = new URL(currentURL);
      url.searchParams.delete('workflow');
      window.history.replaceState({ workflowId: null, view: validation.view }, '', url.toString());
      
      return {
        workflowId: null,
        view: validation.view
      };
    }
    
    // Caso padrão: retornar os valores validados
    return {
      workflowId: validation.workflowId,
      view: validation.view
    };
  });

  const updateURL = useCallback((workflowId: string | null, view: 'chat' | 'workflow' | 'preview') => {
    const url = new URL(window.location.href);
    
    if (workflowId) {
      url.searchParams.set('workflow', workflowId);
    } else {
      url.searchParams.delete('workflow');
    }
    
    url.searchParams.set('view', view);
    
    // Usar pushState para navegação, mas não disparar popstate
    window.history.pushState({ workflowId, view }, '', url.toString());
    
    setState({ workflowId, view });
  }, []);

  const navigate = useCallback((workflowId: string | null, view: 'chat' | 'workflow' | 'preview') => {
    updateURL(workflowId, view);
  }, [updateURL]);

  // Escutar mudanças na URL (navegação do browser)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setState(event.state);
      } else {
        // Fallback para quando não há state (ex: refresh da página)
        const currentURL = window.location.href;
        const validation = validateURLParams(currentURL);
        
        // Se a URL não é válida, normalizar e definir estado padrão
        if (!validation.isValid) {
          const normalizedURL = normalizeURL(currentURL);
          window.history.replaceState({ workflowId: null, view: 'chat' }, '', normalizedURL);
          
          setState({
            workflowId: null,
            view: 'chat'
          });
        } else {
          setState({
            workflowId: validation.workflowId,
            view: validation.view
          });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Função para resetar para o estado padrão (novo chat)
  const resetToDefault = useCallback(() => {
    navigate(null, 'chat');
  }, [navigate]);

  return {
    workflowId: state.workflowId,
    view: state.view,
    navigate,
    updateURL,
    resetToDefault
  };
}
