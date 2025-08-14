// Validation utility functions

import { VALIDATION } from '../config';

/**
 * Validate workflow name
 */
export function validateWorkflowName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Nome do workflow é obrigatório' };
  }
  
  if (name.length > VALIDATION.MAX_WORKFLOW_NAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Nome do workflow deve ter no máximo ${VALIDATION.MAX_WORKFLOW_NAME_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate workflow description
 */
export function validateWorkflowDescription(description: string): { isValid: boolean; error?: string } {
  if (description && description.length > VALIDATION.MAX_WORKFLOW_DESCRIPTION_LENGTH) {
    return { 
      isValid: false, 
      error: `Descrição do workflow deve ter no máximo ${VALIDATION.MAX_WORKFLOW_DESCRIPTION_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate node name
 */
export function validateNodeName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Nome do nó é obrigatório' };
  }
  
  if (name.length > VALIDATION.MAX_NODE_NAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Nome do nó deve ter no máximo ${VALIDATION.MAX_NODE_NAME_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate parameter key
 */
export function validateParameterKey(key: string): { isValid: boolean; error?: string } {
  if (!key || key.trim().length === 0) {
    return { isValid: false, error: 'Chave do parâmetro é obrigatória' };
  }
  
  if (key.length > VALIDATION.MAX_PARAMETER_KEY_LENGTH) {
    return { 
      isValid: false, 
      error: `Chave do parâmetro deve ter no máximo ${VALIDATION.MAX_PARAMETER_KEY_LENGTH} caracteres` 
    };
  }
  
  // Check if key contains only valid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
    return { 
      isValid: false, 
      error: 'Chave do parâmetro deve conter apenas letras, números, hífens e underscores' 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate parameter value
 */
export function validateParameterValue(value: any): { isValid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return { isValid: true }; // Null/undefined values are allowed
  }
  
  const valueStr = JSON.stringify(value);
  if (valueStr.length > VALIDATION.MAX_PARAMETER_VALUE_LENGTH) {
    return { 
      isValid: false, 
      error: `Valor do parâmetro deve ter no máximo ${VALIDATION.MAX_PARAMETER_VALUE_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate workflow structure
 */
export function validateWorkflow(workflow: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate basic structure
  if (!workflow || typeof workflow !== 'object') {
    return { isValid: false, errors: ['Workflow inválido'] };
  }
  
  // Validate name
  const nameValidation = validateWorkflowName(workflow.name);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error!);
  }
  
  // Validate description
  if (workflow.description) {
    const descValidation = validateWorkflowDescription(workflow.description);
    if (!descValidation.isValid) {
      errors.push(descValidation.error!);
    }
  }
  
  // Validate nodes
  if (!Array.isArray(workflow.nodes)) {
    errors.push('Nós do workflow devem ser um array');
  } else if (workflow.nodes.length === 0) {
    errors.push('Workflow deve ter pelo menos um nó');
  } else {
    workflow.nodes.forEach((node: any, index: number) => {
      const nodeValidation = validateNode(node, index);
      if (!nodeValidation.isValid) {
        errors.push(...nodeValidation.errors);
      }
    });
  }
  
  // Validate connections
  if (!Array.isArray(workflow.connections)) {
    errors.push('Conexões do workflow devem ser um array');
  } else {
    workflow.connections.forEach((connection: any, index: number) => {
      const connValidation = validateConnection(connection, index, workflow.nodes);
      if (!connValidation.isValid) {
        errors.push(...connValidation.errors);
      }
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validate node structure
 */
export function validateNode(node: any, index: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!node || typeof node !== 'object') {
    return { isValid: false, errors: [`Nó ${index + 1} é inválido`] };
  }
  
  // Validate required fields
  if (!node.id || typeof node.id !== 'string') {
    errors.push(`Nó ${index + 1} deve ter um ID válido`);
  }
  
  if (!node.type || typeof node.type !== 'string') {
    errors.push(`Nó ${index + 1} deve ter um tipo válido`);
  }
  
  // Validate name
  const nameValidation = validateNodeName(node.name);
  if (!nameValidation.isValid) {
    errors.push(`Nó ${index + 1}: ${nameValidation.error}`);
  }
  
  // Validate position
  if (!Array.isArray(node.position) || node.position.length !== 2) {
    errors.push(`Nó ${index + 1} deve ter uma posição válida [x, y]`);
  } else {
    const [x, y] = node.position;
    if (typeof x !== 'number' || typeof y !== 'number') {
      errors.push(`Nó ${index + 1} deve ter coordenadas numéricas válidas`);
    }
  }
  
  // Validate parameters
  if (node.parameters && typeof node.parameters === 'object') {
    Object.entries(node.parameters).forEach(([key, value]) => {
      const keyValidation = validateParameterKey(key);
      if (!keyValidation.isValid) {
        errors.push(`Nó ${index + 1}, parâmetro ${key}: ${keyValidation.error}`);
      }
      
      const valueValidation = validateParameterValue(value);
      if (!valueValidation.isValid) {
        errors.push(`Nó ${index + 1}, parâmetro ${key}: ${valueValidation.error}`);
      }
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validate connection structure
 */
export function validateConnection(
  connection: any, 
  index: number, 
  nodes: any[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!connection || typeof connection !== 'object') {
    return { isValid: false, errors: [`Conexão ${index + 1} é inválida`] };
  }
  
  // Validate required fields
  if (!connection.id || typeof connection.id !== 'string') {
    errors.push(`Conexão ${index + 1} deve ter um ID válido`);
  }
  
  if (!connection.sourceNodeId || typeof connection.sourceNodeId !== 'string') {
    errors.push(`Conexão ${index + 1} deve ter um nó de origem válido`);
  }
  
  if (!connection.targetNodeId || typeof connection.targetNodeId !== 'string') {
    errors.push(`Conexão ${index + 1} deve ter um nó de destino válido`);
  }
  
  // Validate that source and target nodes exist
  if (connection.sourceNodeId && connection.targetNodeId) {
    const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
    const targetNode = nodes.find(n => n.id === connection.targetNodeId);
    
    if (!sourceNode) {
      errors.push(`Conexão ${index + 1}: Nó de origem não encontrado`);
    }
    
    if (!targetNode) {
      errors.push(`Conexão ${index + 1}: Nó de destino não encontrado`);
    }
    
    // Prevent self-connections
    if (connection.sourceNodeId === connection.targetNodeId) {
      errors.push(`Conexão ${index + 1}: Nó não pode se conectar a si mesmo`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}
