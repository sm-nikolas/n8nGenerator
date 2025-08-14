import { useState, useEffect, useCallback } from 'react';
import { Workflow, Conversation } from '../types';

export type ViewType = 'chat' | 'workflow' | 'preview';

interface RouterState {
  workflowId: string | null;
  conversationId: string | null;
  view: ViewType;
}

export function useRouter() {
  const [state, setState] = useState<RouterState>(() => {
    // Inicializar estado a partir da URL
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('workflow');
    const conversationId = urlParams.get('conversation');
    const view = urlParams.get('view') as ViewType;
    
    // Validar e normalizar parâmetros
    let validView: ViewType = 'chat';
    let validWorkflowId: string | null = null;
    let validConversationId: string | null = null;
    
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
    } else if (conversationId && conversationId.trim().length > 0) {
      validConversationId = conversationId;
      validView = 'chat'; // Conversas sempre são chat
    } else {
      // Sem workflowId ou conversationId, apenas chat é válido
      validView = 'chat';
    }
    
    // Atualizar URL se necessário
    const currentParams = new URLSearchParams(window.location.search);
    const needsUpdate = 
      currentParams.get('workflow') !== validWorkflowId ||
      currentParams.get('conversation') !== validConversationId ||
      currentParams.get('view') !== validView;
    
    if (needsUpdate) {
      const newUrl = new URL(window.location.href);
      if (validWorkflowId) {
        newUrl.searchParams.set('workflow', validWorkflowId);
        newUrl.searchParams.delete('conversation');
      } else {
        newUrl.searchParams.delete('workflow');
      }
      
      if (validConversationId) {
        newUrl.searchParams.set('conversation', validConversationId);
        newUrl.searchParams.delete('workflow');
      } else {
        newUrl.searchParams.delete('conversation');
      }
      
      newUrl.searchParams.set('view', validView);
      
      window.history.replaceState(
        { workflowId: validWorkflowId, conversationId: validConversationId, view: validView },
        '',
        newUrl.toString()
      );
    }
    
    return {
      workflowId: validWorkflowId,
      conversationId: validConversationId,
      view: validView
    };
  });

  const navigate = useCallback((
    workflowId: string | null, 
    view: ViewType,
    conversationId: string | null = null
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
    
    // Usar pushState para navegação
    window.history.pushState(
      { workflowId, conversationId, view },
      '',
      url.toString()
    );
    
    setState({ workflowId, conversationId, view });
  }, []);

  const navigateToView = useCallback((view: ViewType) => {
    if (state.workflowId) {
      navigate(state.workflowId, view);
    } else if (state.conversationId) {
      navigate(null, view, state.conversationId);
    } else if (view === 'chat') {
      navigate(null, 'chat');
    }
  }, [state.workflowId, state.conversationId, navigate]);

  const navigateToWorkflow = useCallback((workflowId: string, view: ViewType = 'chat') => {
    navigate(workflowId, view);
  }, [navigate]);

  const navigateToConversation = useCallback((conversationId: string, view: ViewType = 'chat') => {
    navigate(null, view, conversationId);
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
        const conversationId = urlParams.get('conversation');
        const view = urlParams.get('view') as ViewType;
        
        let validView: ViewType = 'chat';
        let validWorkflowId: string | null = null;
        let validConversationId: string | null = null;
        
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
        } else if (conversationId && conversationId.trim().length > 0) {
          validConversationId = conversationId;
          validView = 'chat';
        } else {
          validView = 'chat';
        }
        
        setState({
          workflowId: validWorkflowId,
          conversationId: validConversationId,
          view: validView
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
    navigateToView,
    navigateToWorkflow,
    navigateToConversation,
    navigateToNewChat,
    resetToDefault
  };
}
