import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Message } from '../types';

type MessageRow = Database['public']['Tables']['messages']['Row'];

export function useMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessagesForWorkflow = useCallback(async (workflowId: string | null) => {
    if (!workflowId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const transformedMessages: Message[] = data.map((row: MessageRow) => ({
          id: row.id,
          content: row.content,
          type: row.type,
          timestamp: new Date(row.created_at),
          workflow: undefined, // Will be populated if needed
        }));

        setMessages(transformedMessages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!userId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .is('workflow_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedMessages: Message[] = data.map(transformMessageFromDB);
      setMessages(transformedMessages);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>, workflowId?: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const messageData = {
        content: message.content,
        type: message.type,
        workflow_id: workflowId || null,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const savedMessage: Message = {
          id: data.id,
          content: data.content,
          type: data.type,
          timestamp: new Date(data.created_at),
          workflow: undefined, // Will be populated if needed
        };

        // Update local state
        setMessages(prev => [...prev, savedMessage]);

        return savedMessage;
      }

      throw new Error('Failed to save message');
    } catch (err) {
      console.error('Error saving message:', err);
      throw err;
    }
  }, [userId]);

  const transformMessageFromDB = useCallback((row: MessageRow): Message => ({
    id: row.id,
    type: row.type,
    content: row.content,
    timestamp: new Date(row.created_at),
    workflow: undefined, // Será preenchido quando necessário
  }), []);

  // Carregar mensagens iniciais quando o usuário mudar
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    saveMessage,
    clearMessages,
    fetchMessagesForWorkflow,
    refetch: fetchMessages,
  };
}