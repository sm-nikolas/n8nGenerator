export interface Conversation {
  id: string;
  title: string;
  userId: string;
  workflowId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount?: number;
  lastMessage?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId?: string | null;
  messageOrder: number;
  metadata?: Record<string, any>;
  workflow?: Workflow;
}
