import { useState, useEffect, useCallback } from 'react';
import { Workflow, Conversation } from '../types';
import { validateURLParams, normalizeURL, createNewChatURL } from '../utils/urlValidation';

interface RouterState {
  workflowId: string | null;
  conversationId: string | null;
  view: 'chat' | 'workflow' | 'preview';
}

export function useRouter() {
  const [state, setState] = useState<RouterState>(() => {
    // Inicializar estado a partir da URL
    const currentURL = window.location.href;
    const urlObj = new URL(currentURL);
    const workflowId = urlObj.searchParams.get('workflow');
    const conversationId = urlObj.searchParams.get('conversation');
    const view = (urlObj.searchParams.get('view') as 'chat' | 'workflow' | 'preview') || 'chat';
    
    return {
      workflowId,
      conversationId,
      view
    };
  });

  const updateURL = useCallback((
    workflowId: string | null, 
    view: 'chat' | 'workflow' | 'preview',
    conversationId?: string | null
  ) => {
    const url = new URL(window.location.href);
    
    if (workflowId) {
      url.searchParams.set('workflow', workflowId);
      url.searchParams.delete('conversation'); // Remove conversation when setting workflow
    } else {
      url.searchParams.delete('workflow');
    }
    
    if (conversationId) {
      url.searchParams.set('conversation', conversationId);
      url.searchParams.delete('workflow'); // Remove workflow when setting conversation
    } else if (!workflowId) {
      url.searchParams.delete('conversation');
    }
    
    url.searchParams.set('view', view);
    
    // Usar pushState para navegação, mas não disparar popstate
    window.history.pushState({ workflowId, conversationId, view }, '', url.toString());
    
    setState({ workflowId, conversationId, view });
  }, []);

  const navigate = useCallback((
    workflowId: string | null, 
    view: 'chat' | 'workflow' | 'preview',
    conversationId?: string | null
  ) => {
    updateURL(workflowId, view, conversationId);
  }, [updateURL]);

  // Escutar mudanças na URL (navegação do browser)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setState(event.state);
      } else {
        // Fallback para quando não há state (ex: refresh da página)
        const currentURL = window.location.href;
        const urlObj = new URL(currentURL);
        const workflowId = urlObj.searchParams.get('workflow');
        const conversationId = urlObj.searchParams.get('conversation');
        const view = (urlObj.searchParams.get('view') as 'chat' | 'workflow' | 'preview') || 'chat';
        
        setState({
          workflowId,
          conversationId,
          view
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Função para resetar para o estado padrão (novo chat)
  const resetToDefault = useCallback(() => {
    navigate(null, 'chat', null);
  }, [navigate]);

  return {
    workflowId: state.workflowId,
    conversationId: state.conversationId,
    view: state.view,
    navigate,
    updateURL,
    resetToDefault
  };
}
