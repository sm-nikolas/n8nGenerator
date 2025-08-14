// URL validation utility functions

/**
 * Valida se uma URL tem os parâmetros necessários
 */
export function validateURLParams(url: string): { 
  isValid: boolean; 
  workflowId: string | null; 
  view: 'chat' | 'workflow' | 'preview';
  errors: string[];
} {
  const errors: string[] = [];
  let workflowId: string | null = null;
  let view: 'chat' | 'workflow' | 'preview' = 'chat';
  
  try {
    const urlObj = new URL(url);
    
    // Extrair parâmetros
    workflowId = urlObj.searchParams.get('workflow');
    const viewParam = urlObj.searchParams.get('view');
    
    // Validar view
    if (viewParam) {
      if (['chat', 'workflow', 'preview'].includes(viewParam)) {
        view = viewParam as 'chat' | 'workflow' | 'preview';
      } else {
        errors.push('Parâmetro "view" deve ser "chat", "workflow" ou "preview"');
      }
    }
    
    // Validar workflowId se fornecido
    if (workflowId) {
      if (workflowId.trim().length === 0) {
        errors.push('ID do workflow não pode estar vazio');
        workflowId = null;
      } else if (workflowId.length > 100) {
        errors.push('ID do workflow é muito longo');
        workflowId = null;
      }
    }
    
    // Validar consistência dos parâmetros
    if (workflowId && (view === 'workflow' || view === 'preview')) {
      // Se há workflowId, as views workflow e preview são válidas
    } else if (!workflowId && view !== 'chat') {
      // Se não há workflowId, apenas a view chat é válida
      errors.push('View "workflow" e "preview" requerem um workflowId');
      view = 'chat';
    }
    
  } catch (error) {
    errors.push('URL inválida');
    return { isValid: false, workflowId: null, view: 'chat', errors };
  }
  
  return {
    isValid: errors.length === 0,
    workflowId,
    view,
    errors
  };
}

/**
 * Normaliza uma URL para garantir que tenha os parâmetros padrão
 */
export function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Se não há view, definir como 'chat'
    if (!urlObj.searchParams.has('view')) {
      urlObj.searchParams.set('view', 'chat');
    }
    
    // Se não há workflowId mas view não é 'chat', resetar para 'chat'
    if (!urlObj.searchParams.has('workflow') && urlObj.searchParams.get('view') !== 'chat') {
      urlObj.searchParams.set('view', 'chat');
    }
    
    return urlObj.toString();
  } catch (error) {
    // Se a URL é inválida, retornar uma URL padrão
    return `${window.location.origin}${window.location.pathname}?view=chat`;
  }
}

/**
 * Cria uma URL para um novo chat
 */
export function createNewChatURL(baseURL: string = window.location.href): string {
  try {
    const urlObj = new URL(baseURL);
    urlObj.searchParams.delete('workflow');
    urlObj.searchParams.set('view', 'chat');
    return urlObj.toString();
  } catch (error) {
    return `${window.location.origin}${window.location.pathname}?view=chat`;
  }
}

/**
 * Cria uma URL para um workflow específico
 */
export function createWorkflowURL(
  workflowId: string, 
  view: 'chat' | 'workflow' | 'preview' = 'chat',
  baseURL: string = window.location.href
): string {
  try {
    const urlObj = new URL(baseURL);
    urlObj.searchParams.set('workflow', workflowId);
    urlObj.searchParams.set('view', view);
    return urlObj.toString();
  } catch (error) {
    return `${window.location.origin}${window.location.pathname}?workflow=${workflowId}&view=${view}`;
  }
}

/**
 * Verifica se uma URL representa um novo chat
 */
export function isNewChatURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return !urlObj.searchParams.has('workflow') && urlObj.searchParams.get('view') === 'chat';
  } catch (error) {
    return false;
  }
}

/**
 * Verifica se uma URL representa um workflow específico
 */
export function isWorkflowURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.has('workflow') && urlObj.searchParams.has('view');
  } catch (error) {
    return false;
  }
}

/**
 * Extrai informações da URL de forma segura
 */
export function extractURLInfo(url: string): {
  workflowId: string | null;
  view: 'chat' | 'workflow' | 'preview';
  isValid: boolean;
} {
  try {
    const urlObj = new URL(url);
    const workflowId = urlObj.searchParams.get('workflow');
    const view = urlObj.searchParams.get('view') as 'chat' | 'workflow' | 'preview';
    
    return {
      workflowId,
      view: view || 'chat',
      isValid: true
    };
  } catch (error) {
    return {
      workflowId: null,
      view: 'chat',
      isValid: false
    };
  }
}
