export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  typeVersion?: number;
  position: { x: number; y: number };
  parameters: Record<string, any>;
}

export interface WorkflowConnections {
  [nodeName: string]: {
    main: Array<Array<{
      node: string;
      type: string;
      index: number;
    }>>;
  };
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string timestamp
  messageOrder: number;
  metadata?: Record<string, any>;
  workflow?: Workflow;
  workflowId?: string | null; // Campo direto da tabela
}
