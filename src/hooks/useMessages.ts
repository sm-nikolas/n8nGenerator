import { useState, useCallback, useEffect } from 'react';
import { Message, Workflow } from '../types'; // Removido Conversation
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export function useMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchMessagesForWorkflow = useCallback(async (workflowId: string | null) => {
    if (!workflowId || !userId) {
      setMessages([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('user_id', userId)
        .order('message_order', { ascending: true });

                   if (error) {
               toast.error('Erro ao buscar mensagens. Tente novamente.');
               return;
             }

      const formattedMessages: Message[] = data.map(row => ({
        id: row.id,
        type: row.type,
        content: row.content,
        timestamp: row.created_at,
        workflowId: row.workflow_id,
        messageOrder: row.message_order || 0,
        metadata: row.metadata || {},
        workflow: row.workflow
      }));

      setMessages(formattedMessages);
               } catch (error) {
             toast.error('Erro ao buscar mensagens. Tente novamente.');
           }
  }, [userId]);

  const saveMessage = useCallback(async (
    message: Omit<Message, 'id' | 'timestamp' | 'messageOrder' | 'metadata'>,
    workflowId?: string
  ): Promise<Message> => {
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Determinar a ordem da mensagem no workflow
      let messageOrder = 0;
      if (workflowId) {
        const workflowMessages = messages.filter(m => m.workflowId === workflowId);
        messageOrder = workflowMessages.length;
      }

      // Preparar metadados da mensagem
      const metadata: Record<string, any> = {};
      if (workflowId) {
        metadata.workflowId = workflowId;
      }

      const messageToSave = {
        ...message,
        messageOrder,
        metadata
      };

      const { data, error } = await supabase
        .from('messages')
        .insert({
          type: messageToSave.type,
          content: messageToSave.content,
          user_id: userId,
          workflow_id: workflowId || null,
          message_order: messageToSave.messageOrder,
          metadata: messageToSave.metadata
        })
        .select('*')
        .single();

                   if (error) {
               toast.error('Erro ao salvar mensagem. Tente novamente.');
               throw error;
             }

      const savedMessage: Message = {
        id: data.id,
        type: data.type,
        content: data.content,
        timestamp: data.created_at,
        workflowId: data.workflow_id,
        messageOrder: data.message_order || 0,
        metadata: data.metadata || {},
        workflow: data.workflow
      };

      // Adicionar à lista local
      setMessages(prev => [...prev, savedMessage]);

      return savedMessage;
               } catch (error) {
             toast.error('Erro ao salvar mensagem. Tente novamente.');
             throw error;
           }
  }, [userId, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addMessageToState = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Carregar mensagens quando o userId mudar
  useEffect(() => {
    if (userId) {
      setMessages([]);
    }
  }, [userId]);

  return {
    messages,
    saveMessage,
    clearMessages,
    fetchMessagesForWorkflow,
    addMessageToState,
  };
}