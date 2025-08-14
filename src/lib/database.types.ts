export interface Database {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string;
          name: string;
          description: string;
          nodes: any;
          connections: any;
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
          nodes: any;
          connections: any;
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
          nodes?: any;
          connections?: any;
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
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          type: 'user' | 'assistant';
          workflow_id?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          type?: 'user' | 'assistant';
          workflow_id?: string | null;
          user_id?: string;
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