import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './hooks/useAuth';
import { useWorkflows } from './hooks/useWorkflows';
import { useMessages } from './hooks/useMessages';
import { useAppState } from './hooks/useAppState';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { GoogleAuthCallback } from './components/GoogleAuthCallback';
import { Message, Workflow } from './types';

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
  const { messages, saveMessage, clearMessages, fetchMessagesForWorkflow } = useMessages(user?.id);
  
  const {
    currentWorkflow,
    isLoading,
    sidebarOpen,
    showAuthModal,
    view,
    workflowId,
    toggleSidebar,
    setAuthModal,
    setCurrentWorkflow,
    setLoading,
    resetAppState,
    navigateToWorkflow,
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
        clearMessages();
      }
    } else {
      // Sem workflow na URL, garantir estado inicial limpo
      setCurrentWorkflow(null);
      clearMessages();
    }
  }, [user, workflows, workflowId, setCurrentWorkflow, resetAppState, fetchMessagesForWorkflow, clearMessages]);

  // Carregar mensagens quando o workflow mudar
  useEffect(() => {
    if (user && currentWorkflow) {
      fetchMessagesForWorkflow(currentWorkflow.id);
    }
  }, [currentWorkflow?.id, user, fetchMessagesForWorkflow]);

  const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>, workflowId?: string) => {
    if (!user) {
      setAuthModal(true);
      return;
    }
    
    try {
      const savedMessage = await saveMessage(message, workflowId);
      if (savedMessage.workflow) {
        setCurrentWorkflow(savedMessage.workflow);
        navigateToWorkflow(savedMessage.workflow, 'chat');
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const generateWorkflow = async (prompt: string) => {
    if (!user) {
      setAuthModal(true);
      return;
    }
    
    setLoading(true);
    
    // Add user message
    await addMessage({
      type: 'user',
      content: prompt,
    });

    // Simulate workflow generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock workflow based on prompt
    const workflow = generateMockWorkflow(prompt);
    
    // Save workflow to database
    try {
      const savedWorkflow = await saveWorkflow(workflow);
      
      await addMessage({
        type: 'assistant',
        content: `I've created a custom n8n workflow based on your request. The workflow includes ${workflow.nodes.length} nodes and is ready to use.`,
        workflow: savedWorkflow,
      }, savedWorkflow.id);
      
      setCurrentWorkflow(savedWorkflow);
      navigateToWorkflow(savedWorkflow, 'workflow');
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      await addMessage({
        type: 'assistant',
        content: 'Sorry, there was an error saving the workflow. Please try again.',
      });
    }
    
    setLoading(false);
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

  const handleNewWorkflow = () => {
    setCurrentWorkflow(null);
    navigateToNewChat();
    clearMessages();
  };

  const handleSelectWorkflow = async (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    navigateToWorkflow(workflow, 'chat');
  };

  const handleViewChange = (newView: 'chat' | 'workflow' | 'preview') => {
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
                currentWorkflow={currentWorkflow}
                messages={messages}
                isLoading={isLoading}
                sidebarOpen={sidebarOpen}
                view={view}
                onToggleSidebar={toggleSidebar}
                onViewChange={handleViewChange}
                onSelectWorkflow={handleSelectWorkflow}
                onNewWorkflow={handleNewWorkflow}
                onDeleteWorkflow={handleDeleteWorkflow}
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