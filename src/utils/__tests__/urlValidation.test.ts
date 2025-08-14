// Testes para as funções de validação de URL

import { 
  validateURLParams, 
  normalizeURL, 
  createNewChatURL, 
  createWorkflowURL,
  isNewChatURL,
  isWorkflowURL,
  extractURLInfo
} from '../urlValidation';

describe('URL Validation Functions', () => {
  const baseURL = 'https://example.com/app';
  
  describe('validateURLParams', () => {
    it('should validate a valid new chat URL', () => {
      const url = `${baseURL}?view=chat`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe(null);
      expect(result.view).toBe('chat');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid workflow URL', () => {
      const url = `${baseURL}?workflow=123&view=workflow`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe('123');
      expect(result.view).toBe('workflow');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid preview URL', () => {
      const url = `${baseURL}?workflow=123&view=preview`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe('123');
      expect(result.view).toBe('preview');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle URL without parameters', () => {
      const url = baseURL;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe(null);
      expect(result.view).toBe('chat');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle URL with only workflow parameter', () => {
      const url = `${baseURL}?workflow=123`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe('123');
      expect(result.view).toBe('chat');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle URL with only view parameter', () => {
      const url = `${baseURL}?view=chat`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe(null);
      expect(result.view).toBe('chat');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid view parameter', () => {
      const url = `${baseURL}?view=invalid`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parâmetro "view" deve ser "chat", "workflow" ou "preview"');
    });

    it('should reject empty workflow ID', () => {
      const url = `${baseURL}?workflow=&view=chat`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID do workflow não pode estar vazio');
      expect(result.workflowId).toBe(null);
    });

    it('should reject very long workflow ID', () => {
      const longId = 'a'.repeat(101);
      const url = `${baseURL}?workflow=${longId}&view=chat`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID do workflow é muito longo');
      expect(result.workflowId).toBe(null);
    });

    it('should reject workflow/preview view without workflow ID', () => {
      const url = `${baseURL}?view=workflow`;
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('View "workflow" e "preview" requerem um workflowId');
      expect(result.view).toBe('chat');
    });

    it('should handle invalid URL', () => {
      const url = 'invalid-url';
      const result = validateURLParams(url);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL inválida');
      expect(result.workflowId).toBe(null);
      expect(result.view).toBe('chat');
    });
  });

  describe('normalizeURL', () => {
    it('should add missing view parameter', () => {
      const url = baseURL;
      const result = normalizeURL(url);
      
      expect(result).toBe(`${baseURL}?view=chat`);
    });

    it('should add missing view parameter when workflow exists', () => {
      const url = `${baseURL}?workflow=123`;
      const result = normalizeURL(url);
      
      expect(result).toBe(`${baseURL}?workflow=123&view=chat`);
    });

    it('should reset invalid view to chat when no workflow', () => {
      const url = `${baseURL}?view=workflow`;
      const result = normalizeURL(url);
      
      expect(result).toBe(`${baseURL}?view=chat`);
    });

    it('should preserve valid workflow and view', () => {
      const url = `${baseURL}?workflow=123&view=workflow`;
      const result = normalizeURL(url);
      
      expect(result).toBe(url);
    });

    it('should handle invalid URL gracefully', () => {
      const url = 'invalid-url';
      const result = normalizeURL(url);
      
      expect(result).toContain('?view=chat');
    });
  });

  describe('createNewChatURL', () => {
    it('should create new chat URL', () => {
      const result = createNewChatURL(baseURL);
      expect(result).toBe(`${baseURL}?view=chat`);
    });

    it('should remove workflow parameter when creating new chat', () => {
      const url = `${baseURL}?workflow=123&view=workflow`;
      const result = createNewChatURL(url);
      expect(result).toBe(`${baseURL}?view=chat`);
    });

    it('should handle invalid base URL gracefully', () => {
      const result = createNewChatURL('invalid-url');
      expect(result).toContain('?view=chat');
    });
  });

  describe('createWorkflowURL', () => {
    it('should create workflow URL with default view', () => {
      const result = createWorkflowURL('123', 'chat', baseURL);
      expect(result).toBe(`${baseURL}?workflow=123&view=chat`);
    });

    it('should create workflow URL with specific view', () => {
      const result = createWorkflowURL('123', 'workflow', baseURL);
      expect(result).toBe(`${baseURL}?workflow=123&view=workflow`);
    });

    it('should handle invalid base URL gracefully', () => {
      const result = createWorkflowURL('123', 'chat', 'invalid-url');
      expect(result).toContain('workflow=123&view=chat');
    });
  });

  describe('isNewChatURL', () => {
    it('should return true for new chat URL', () => {
      const url = `${baseURL}?view=chat`;
      expect(isNewChatURL(url)).toBe(true);
    });

    it('should return true for URL without parameters', () => {
      expect(isNewChatURL(baseURL)).toBe(false);
    });

    it('should return false for workflow URL', () => {
      const url = `${baseURL}?workflow=123&view=chat`;
      expect(isNewChatURL(url)).toBe(false);
    });

    it('should handle invalid URL gracefully', () => {
      expect(isNewChatURL('invalid-url')).toBe(false);
    });
  });

  describe('isWorkflowURL', () => {
    it('should return true for workflow URL', () => {
      const url = `${baseURL}?workflow=123&view=chat`;
      expect(isWorkflowURL(url)).toBe(true);
    });

    it('should return false for new chat URL', () => {
      const url = `${baseURL}?view=chat`;
      expect(isWorkflowURL(url)).toBe(false);
    });

    it('should return false for URL without parameters', () => {
      expect(isWorkflowURL(baseURL)).toBe(false);
    });

    it('should handle invalid URL gracefully', () => {
      expect(isWorkflowURL('invalid-url')).toBe(false);
    });
  });

  describe('extractURLInfo', () => {
    it('should extract workflow and view from valid URL', () => {
      const url = `${baseURL}?workflow=123&view=workflow`;
      const result = extractURLInfo(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe('123');
      expect(result.view).toBe('workflow');
    });

    it('should extract info from URL with only view', () => {
      const url = `${baseURL}?view=chat`;
      const result = extractURLInfo(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe(null);
      expect(result.view).toBe('chat');
    });

    it('should extract info from URL with only workflow', () => {
      const url = `${baseURL}?workflow=123`;
      const result = extractURLInfo(url);
      
      expect(result.isValid).toBe(true);
      expect(result.workflowId).toBe('123');
      expect(result.view).toBe('chat');
    });

    it('should handle invalid URL gracefully', () => {
      const result = extractURLInfo('invalid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.workflowId).toBe(null);
      expect(result.view).toBe('chat');
    });
  });
});
