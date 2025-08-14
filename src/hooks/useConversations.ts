import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Conversation } from '../types';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar conversas com contagem de mensagens e última mensagem
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!inner(count),
          last_message:messages(content, created_at)
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformedConversations: Conversation[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          userId: row.user_id,
          workflowId: row.workflow_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastMessageAt: row.last_message_at,
          messageCount: row.messages?.length || 0,
          lastMessage: row.last_message?.[0]?.content || '',
        }));

        setConversations(transformedConversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createConversation = useCallback(async (
    title: string, 
    workflowId?: string
  ): Promise<Conversation | null> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const conversationData = {
        title,
        user_id: userId,
        workflow_id: workflowId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newConversation: Conversation = {
          id: data.id,
          title: data.title,
          userId: data.user_id,
          workflowId: data.workflow_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          lastMessageAt: data.last_message_at,
          messageCount: 0,
          lastMessage: '',
        };

        // Atualizar estado local
        setConversations(prev => [newConversation, ...prev]);
        return newConversation;
      }

      return null;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, [userId]);

  const updateConversation = useCallback(async (
    conversationId: string, 
    updates: Partial<Pick<Conversation, 'title'>>
  ): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          title: updates.title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Atualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
            : conv
        )
      );
    } catch (err) {
      console.error('Error updating conversation:', err);
      throw err;
    }
  }, [userId]);

  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Atualizar estado local
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  }, [userId]);

  const findConversationByWorkflow = useCallback((workflowId: string): Conversation | null => {
    return conversations.find(conv => conv.workflowId === workflowId) || null;
  }, [conversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    findConversationByWorkflow,
    refetch: fetchConversations,
  };
}