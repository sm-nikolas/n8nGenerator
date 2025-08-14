import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Workflow } from '../types';

type WorkflowRow = Database['public']['Tables']['workflows']['Row'];

export function useWorkflows(userId: string | undefined) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const workflowsWithNodes = data.map((row: WorkflowRow) => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          nodes: row.nodes || [],
          edges: row.connections || [], // Map connections to edges
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          userId: row.user_id,
        }));

        setWorkflows(workflowsWithNodes);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveWorkflow = useCallback(async (workflow: Workflow): Promise<Workflow> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const workflowData = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        connections: workflow.edges, // Map edges to connections
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('workflows')
        .upsert(workflowData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const savedWorkflow: Workflow = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          nodes: data.nodes || [],
          edges: data.connections || [], // Map connections to edges
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          userId: data.user_id,
        };

        // Update local state
        setWorkflows(prev => {
          const existing = prev.find(w => w.id === workflow.id);
          if (existing) {
            return prev.map(w => w.id === workflow.id ? savedWorkflow : w);
          } else {
            return [savedWorkflow, ...prev];
          }
        });

        return savedWorkflow;
      }

      throw new Error('Failed to save workflow');
    } catch (err) {
      console.error('Error saving workflow:', err);
      throw err;
    }
  }, [userId]);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      // Update local state
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    } catch (err) {
      console.error('Error deleting workflow:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    saveWorkflow,
    deleteWorkflow,
    refetch: fetchWorkflows,
  };
}