export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          title: string;
          user_id: string;
          workflow_id: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          user_id: string;
          workflow_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          user_id?: string;
          workflow_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
        };
      };
      workflows: {
        Row: {
          id: string;
          name: string;
          description: string;
          nodes: WorkflowNode[];
          connections: WorkflowConnections;
          created_at: string;
          updated_at: string;
          user_id: string;
          is_public: boolean;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          nodes: WorkflowNode[];
          connections: WorkflowConnections;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          is_public?: boolean;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          nodes?: WorkflowNode[];
          connections?: WorkflowConnections;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          is_public?: boolean;
          tags?: string[] | null;
        };
      };
      messages: {
        Row: {
          id: string;
          content: string;
          type: 'user' | 'assistant';
          workflow_id: string | null;
          conversation_id: string | null;
          user_id: string;
          message_order: number;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          type: 'user' | 'assistant';
          workflow_id?: string | null;
          conversation_id?: string | null;
          user_id: string;
          message_order?: number;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          type?: 'user' | 'assistant';
          workflow_id?: string | null;
          conversation_id?: string | null;
          user_id?: string;
          message_order?: number;
          metadata?: any;
          created_at?: string;
        };
      };
      workflow_executions: {
        Row: {
          id: string;
          workflow_id: string;
          status: 'running' | 'completed' | 'failed';
          started_at: string;
          completed_at: string | null;
          execution_data: any | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          status: 'running' | 'completed' | 'failed';
          started_at?: string;
          completed_at?: string | null;
          execution_data?: any | null;
          user_id: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          status?: 'running' | 'completed' | 'failed';
          started_at?: string;
          completed_at?: string | null;
          execution_data?: any | null;
          user_id?: string;
        };
      };
    };
  };
}

// Tipos específicos para n8n
export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
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