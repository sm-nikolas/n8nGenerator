import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './hooks/useAuth';
import { useWorkflows } from './hooks/useWorkflows';
import { useMessages } from './hooks/useMessages';
import { useConversations } from './hooks/useConversations';
import { useAppState } from './hooks/useAppState';
import { ViewType } from './hooks/useRouter';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { GoogleAuthCallback } from './components/GoogleAuthCallback';
import { Message, Workflow, Conversation } from './types';

// Função para gerar workflow mock
const generateMockWorkflow = (prompt: string): Workflow => {
  const workflowId = uuidv4();
  return {
    id: workflowId,
    name: `Workflow: ${prompt.substring(0, 50)}...`,
    description: `Automated workflow generated from: ${prompt}`,
    nodes: [
      {
        id: uuidv4(),
        type: 'trigger',
        name: 'Manual Trigger',
        position: { x: 100, y: 100 },
        data: { label: 'Start' }
      },
      {
        id: uuidv4(),
        type: 'action',
        name: 'HTTP Request',
        position: { x: 300, y: 100 },
        data: { label: 'API Call' }
      }
    ],
    edges: [
      {
        id: uuidv4(),
        source: 'trigger',
        target: 'action'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: ''
  };
};

function App() {
  const { user, loading: authLoading } = useAuth();
  const { workflows, saveWorkflow, deleteWorkflow } = useWorkflows(user?.id);
  const { conversations, createConversation, deleteConversation: removeConversation } = useConversations(user?.id);
  const { messages, saveMessage, clearMessages, fetchMessagesForConversation, fetchMessagesForWorkflow, addMessageToState } = useMessages(user?.id);
  
  const {
    currentWorkflow,
    currentConversation,
    isLoading,
    sidebarOpen,
    showAuthModal,
    view,
    workflowId,
    conversationId,
    toggleSidebar,
    setAuthModal,
    setCurrentWorkflow,
    setCurrentConversation,
    setLoading,
    resetAppState,
    navigateToWorkflow,
    navigateToConversation,
    navigateToNewChat,
    navigateToView,
  } = useAppState();

  // Sincronizar workflow atual com o roteamento
  useEffect(() => {
    if (user && workflows && workflowId) {
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        setCurrentWorkflow(workflow);
        fetchMessagesForWorkflow(workflowId);
      } else {
        // Workflow não encontrado, limpar URL e estado
        resetAppState();
      }
    } else if (user && conversations && conversationId) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        fetchMessagesForConversation(conversationId);
      } else {
        // Conversa não encontrada, limpar URL e estado
        resetAppState();
      }
    } else {
      // Sem workflow na URL, garantir estado inicial limpo
      setCurrentWorkflow(null);
      setCurrentConversation(null);
      if (!conversationId && !workflowId) {
        clearMessages();
      }
    }
  }, [user, workflows, conversations, workflowId, conversationId, setCurrentWorkflow, setCurrentConversation, resetAppState, fetchMessagesForWorkflow, fetchMessagesForConversation, clearMessages]);

  // Carregar mensagens quando o workflow mudar
  useEffect(() => {
    if (user && currentWorkflow) {
      fetchMessagesForWorkflow(currentWorkflow.id);
    } else if (user && currentConversation) {
      fetchMessagesForConversation(currentConversation.id);
    }
  }, [currentWorkflow?.id, currentConversation?.id, user, fetchMessagesForWorkflow, fetchMessagesForConversation]);

  const addMessage = async (
    message: Omit<Message, 'id' | 'timestamp' | 'messageOrder'>, 
    conversationId?: string,
    workflowId?: string
  ) => {
    if (!user) {
      setAuthModal(true);
      return;
    }
    
    try {
      const savedMessage = await saveMessage(message, conversationId, workflowId);
      if (savedMessage.workflow) {
        setCurrentWorkflow(savedMessage.workflow);
        navigateToWorkflow(savedMessage.workflow, 'chat');
      } else if (savedMessage.conversationId && !conversationId) {
        // Nova conversa foi criada automaticamente
        const newConversation = conversations.find(c => c.id === savedMessage.conversationId);
        if (newConversation) {
          setCurrentConversation(newConversation);
          navigateToConversation(newConversation, 'chat');
        }
      }
      return savedMessage;
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  };

  const generateWorkflow = async (prompt: string) => {
    if (!user) {
      setAuthModal(true);
      return;
    }
    
    setLoading(true);
    
    // Determinar se deve criar novo workflow ou continuar conversa existente
    let activeConversationId = currentConversation?.id;
    let shouldGenerateNewWorkflow = !currentWorkflow && !currentConversation;
    
    // Se não há conversa atual, criar uma nova
    if (!activeConversationId) {
      const title = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
      const newConversation = await createConversation(title);
      if (newConversation) {
        setCurrentConversation(newConversation);
        activeConversationId = newConversation.id;
        navigateToConversation(newConversation, 'chat');
        shouldGenerateNewWorkflow = true; // Nova conversa = novo workflow
      }
    }

    // Adicionar mensagem do usuário à conversa
    const userMessage = await addMessage({
      type: 'user',
      content: prompt,
    }, activeConversationId, currentWorkflow?.id);

    try {
      let responseContent = '';
      let workflowToUse = currentWorkflow;
      
      if (shouldGenerateNewWorkflow) {
        // Simular geração de workflow apenas para nova conversa
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Gerar novo workflow baseado no prompt
        const workflow = generateMockWorkflow(prompt);
        workflowToUse = await saveWorkflow(workflow);
        
        responseContent = `I've created a custom n8n workflow based on your request: "${prompt}". The workflow includes ${workflowToUse.nodes.length} nodes and is ready to use. You can now ask me to modify it, add more functionality, or explain how it works.`;
        
        setCurrentWorkflow(workflowToUse);
        navigateToWorkflow(workflowToUse, 'chat');
      } else {
        // Continuar conversa existente sobre o workflow atual
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (currentWorkflow) {
          // Simular resposta contextual sobre o workflow existente
          responseContent = generateContextualResponse(prompt, currentWorkflow);
        } else {
          responseContent = `I understand you want to discuss: "${prompt}". Could you provide more details about what kind of workflow you'd like me to create?`;
        }
      }
      
      // Adicionar resposta do assistente
      await addMessage({
        type: 'assistant',
        content: responseContent,
        ...(shouldGenerateNewWorkflow && workflowToUse ? { workflow: workflowToUse } : {})
      }, activeConversationId, workflowToUse?.id);
      
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      await addMessage({
        type: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
      }, activeConversationId);
    }
    
    setLoading(false);
  };

  // Função para gerar respostas contextuais sobre workflow existente
  const generateContextualResponse = (prompt: string, workflow: Workflow): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('add') || lowerPrompt.includes('adicionar')) {
      return `I can help you add new functionality to "${workflow.name}". Based on your request, I suggest adding nodes for the functionality you mentioned. Would you like me to show you how to implement this?`;
    }
    
    if (lowerPrompt.includes('modify') || lowerPrompt.includes('change') || lowerPrompt.includes('modificar') || lowerPrompt.includes('alterar')) {
      return `I can help you modify "${workflow.name}". The current workflow has ${workflow.nodes.length} nodes. What specific changes would you like me to make?`;
    }
    
    if (lowerPrompt.includes('explain') || lowerPrompt.includes('how') || lowerPrompt.includes('explicar') || lowerPrompt.includes('como')) {
      return `Let me explain how "${workflow.name}" works: This workflow starts with a ${workflow.nodes[0]?.type || 'trigger'} and processes data through ${workflow.nodes.length} nodes. Each node performs a specific function in the automation process.`;
    }
    
    if (lowerPrompt.includes('error') || lowerPrompt.includes('problem') || lowerPrompt.includes('erro') || lowerPrompt.includes('problema')) {
      return `I can help you troubleshoot "${workflow.name}". Common issues include connection problems, data format mismatches, or authentication errors. What specific error are you encountering?`;
    }
    
    if (lowerPrompt.includes('optimize') || lowerPrompt.includes('improve') || lowerPrompt.includes('otimizar') || lowerPrompt.includes('melhorar')) {
      return `I can suggest optimizations for "${workflow.name}". Some ways to improve performance include: reducing unnecessary nodes, optimizing data transformations, and adding error handling. Which aspect would you like to focus on?`;
    }
    
    // Resposta genérica contextual
    return `I understand you want to discuss "${prompt}" in relation to your workflow "${workflow.name}". This workflow currently has ${workflow.nodes.length} nodes and ${workflow.edges.length} connections. How can I help you with this specific aspect?`;
  };

  const handleUpdateWorkflow = async (updatedWorkflow: Workflow) => {
    if (!user) return;
    
    try {
      const savedWorkflow = await saveWorkflow(updatedWorkflow);
      setCurrentWorkflow(savedWorkflow);
    } catch (error) {
      console.error('Erro ao atualizar workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!user) return;
    
    try {
      await deleteWorkflow(workflowId);
      if (currentWorkflow?.id === workflowId) {
        setCurrentWorkflow(null);
        resetAppState();
        clearMessages();
      }
    } catch (error) {
      console.error('Erro ao deletar workflow:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return;
    
    try {
      await removeConversation(conversationId);
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        resetAppState();
        clearMessages();
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    }
  };

  const handleNewWorkflow = () => {
    setCurrentWorkflow(null);
    setCurrentConversation(null);
    navigateToNewChat();
    clearMessages();
  };

  const handleSelectWorkflow = async (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    setCurrentConversation(null);
    navigateToWorkflow(workflow, 'chat');
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setCurrentWorkflow(null);
    navigateToConversation(conversation, 'chat');
  };

  const handleViewChange = (newView: ViewType) => {
    if (newView === view) return;
    navigateToView(newView);
  };

  const handleGetStarted = () => {
    setAuthModal(true);
  };

  // Loading state
  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Rota de callback do Google OAuth */}
        <Route path="/auth/callback" element={<GoogleAuthCallback />} />
        
        {/* Rota principal da aplicação */}
        <Route path="/*" element={
          <>
            {!user ? (
              <LandingPage onGetStarted={handleGetStarted} />
            ) : (
              <Layout
                user={user}
                workflows={workflows}
                conversations={conversations}
                currentWorkflow={currentWorkflow}
                currentConversation={currentConversation}
                messages={messages}
                isLoading={isLoading}
                sidebarOpen={sidebarOpen}
                view={view}
                onToggleSidebar={toggleSidebar}
                onViewChange={handleViewChange}
                onSelectWorkflow={handleSelectWorkflow}
                onSelectConversation={handleSelectConversation}
                onNewWorkflow={handleNewWorkflow}
                onDeleteWorkflow={handleDeleteWorkflow}
                onDeleteConversation={handleDeleteConversation}
                onUpdateWorkflow={handleUpdateWorkflow}
                onSendMessage={generateWorkflow}
              />
            )}
            
            {/* Modal de autenticação */}
            <AuthModal isOpen={showAuthModal} onClose={() => setAuthModal(false)} />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;