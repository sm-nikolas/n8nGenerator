import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';
import { useWorkflows } from './hooks/useWorkflows';
import { useMessages } from './hooks/useMessages';
import { useAppState } from './hooks/useAppState';
import { ViewType } from './hooks/useRouter';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import { showErrorToast, showSuccessToast } from './utils/toastUtils';
import 'react-toastify/dist/ReactToastify.css';

import { GoogleAuthCallback } from './components/GoogleAuthCallback';
import { Message, Workflow } from './types'; // Removido Conversation
import { supabase } from './lib/supabase';
import { generateMockWorkflow } from './data/mockWorkflows';

// Função para gerar workflow mock - agora importada do arquivo mockWorkflows.ts

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

  // Estado para controlar loading de sincronização
  const [isRestoring, setIsRestoring] = useState(false);

  // Restaurar workflow ativo do localStorage após carregar workflows
  useEffect(() => {
    const restoreWorkflow = async () => {
      if (user && workflows && workflows.length > 0) {
        // Tentar restaurar do localStorage
        const savedWorkflowId = localStorage.getItem('activeWorkflowId');
        
        if (savedWorkflowId && !currentWorkflow) {
          setIsRestoring(true);
          
          try {
            // Iniciar timer mínimo de 1 segundo
            const minLoadingPromise = new Promise(resolve => setTimeout(resolve, 1000));
            
            const workflow = workflows.find(w => w.id === savedWorkflowId);
            
            if (workflow) {
              setCurrentWorkflow(workflow);
              
              // Aguardar tanto a restauração quanto o tempo mínimo
              await Promise.all([
                fetchMessagesForWorkflow(savedWorkflowId),
                minLoadingPromise
              ]);
            } else {
              localStorage.removeItem('activeWorkflowId');
              
              // Aguardar apenas o tempo mínimo
              await minLoadingPromise;
            }
          } catch {
            return;
          } finally {
            setIsRestoring(false);
          }
        }
      }
    };

    restoreWorkflow();
  }, [user, workflows, setCurrentWorkflow, fetchMessagesForWorkflow]);

  // Carregar workflow mock padrão se não houver workflow ativo
  useEffect(() => {
    if (user && !currentWorkflow && workflows.length === 0) {
      const loadDefaultWorkflow = async () => {
        try {
          const defaultWorkflow = generateMockWorkflow();
          const savedWorkflow = await saveWorkflow(defaultWorkflow);
          setCurrentWorkflow(savedWorkflow);
        } catch (error) {
          // Silently handle error
        }
      };
      
      loadDefaultWorkflow();
    }
  }, [user, currentWorkflow, workflows.length, saveWorkflow, setCurrentWorkflow]);


  // Carregar mensagens quando o workflow mudar
  useEffect(() => {
    if (user && currentWorkflow) {
      fetchMessagesForWorkflow(currentWorkflow.id);
    }
  }, [currentWorkflow?.id, user, fetchMessagesForWorkflow]);



  // Sincronizar URL quando workflow for restaurado
  useEffect(() => {
    if (currentWorkflow && workflowId !== currentWorkflow.id) {
      navigateToWorkflow(currentWorkflow, 'chat');
    }
  }, [currentWorkflow, workflowId, navigateToWorkflow]);

  // Loading state inicial para evitar piscar azul
  if (authLoading) {
    return (
      <div className="h-screen bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-2xl">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  const addMessage = async (
    message: Omit<Message, 'id' | 'timestamp' | 'messageOrder' | 'metadata'>, 
    workflowId?: string
  ) => {
    if (!user) {
      setAuthModal(true);
      return;
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
      
      const savedMessage = await saveMessage(messageToSave, workflowId);
      
      if (savedMessage.workflow) {
        setCurrentWorkflow(savedMessage.workflow);
        navigateToWorkflow(savedMessage.workflow, 'chat');
      }
      
      return savedMessage;
    } catch {
      return;
    }
  };

  // Função para atualizar mensagens existentes com workflowId
  const updateMessageWorkflowId = async (messageId: string, workflowId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          workflow_id: workflowId,
          metadata: { workflowId }
        })
        .eq('id', messageId)
        .eq('user_id', user.id);
      
      if (error) {
        showErrorToast('Error updating message. Please try again.', 'update-message-error');
      }
    } catch (error) {
              showErrorToast('Error updating message. Please try again.', 'update-message-error');
    }
  };

  const generateWorkflow = async (prompt: string) => {
    if (!user) {
      setAuthModal(true);
      return;
    }
    
    setLoading(true);
    
    let shouldGenerateNewWorkflow = false;
    
    // Se não há workflow atual, criar um novo
    if (!currentWorkflow) {
      shouldGenerateNewWorkflow = true;
    } else {
      // Verificar se o usuário quer criar um novo workflow
      const lowerPrompt = prompt.toLowerCase();
      const isForceNewRequest = lowerPrompt.includes('create new') || 
                               lowerPrompt.includes('criar novo') || 
                               lowerPrompt.includes('make another') || 
                               lowerPrompt.includes('fazer outro') ||
                               lowerPrompt.includes('start over') ||
                               lowerPrompt.includes('começar de novo');
      
      if (isForceNewRequest) {
        shouldGenerateNewWorkflow = true;
      } else {
        // Manter contexto do workflow atual
        shouldGenerateNewWorkflow = false;
      }
    }

    // Adicionar mensagem do usuário
    const userMessage = await addMessage({
      type: 'user',
      content: prompt,
    }, currentWorkflow?.id);

    try {
      let responseContent = '';
      let workflowToUse = currentWorkflow;
      
      if (shouldGenerateNewWorkflow) {
        // Simular geração de workflow
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Gerar novo workflow baseado no prompt
        const workflow = generateMockWorkflow();
        workflowToUse = await saveWorkflow(workflow);
        
        // Atualizar a mensagem inicial do usuário com o workflowId correto
        if (userMessage && !userMessage.workflowId) {
          await updateMessageWorkflowId(userMessage.id, workflowToUse.id);
        }
        
        if (currentWorkflow) {
          // Substituindo workflow existente
          responseContent = `I've created a new n8n workflow based on your request: "${prompt}". This replaces the previous workflow "${currentWorkflow.name}". The new workflow includes ${workflowToUse.nodes.length} nodes and is ready to use. You can now ask me to modify it, add more functionality, or explain how it works.`;
        } else {
          // Primeiro workflow
          responseContent = `I've created a custom n8n workflow based on your request: "${prompt}". The workflow includes ${workflowToUse.nodes.length} nodes and is ready to use. You can now ask me to modify it, add more functionality, or explain how it works.`;
        }
        
        setCurrentWorkflow(workflowToUse);
        navigateToWorkflow(workflowToUse, 'chat');
      } else {
        // Continuar conversa existente sobre o workflow atual
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (currentWorkflow) {
          // Simular resposta contextual sobre o workflow existente
          responseContent = generateContextualResponse(prompt, currentWorkflow);
        } else {
          responseContent = `I understand you want to discuss: "${prompt}". Since we don't have an active workflow, you can ask me to create a new one by saying "create a workflow for..." or "make a workflow that...".`;
        }
      }
      
      // Adicionar resposta do assistente
      const assistantMessage = {
        type: 'assistant' as const,
        content: responseContent,
        ...(shouldGenerateNewWorkflow && workflowToUse ? { workflow: workflowToUse } : {})
      };
      
      await addMessage(assistantMessage, workflowToUse?.id);
             
    } catch (error) {
              showErrorToast('Error processing your request. Please try again.', 'process-request-error');
      await addMessage({
        type: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
      });
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
    
    if (lowerPrompt.includes('delete') || lowerPrompt.includes('remove') || lowerPrompt.includes('deletar') || lowerPrompt.includes('remover')) {
      return `I can help you remove elements from "${workflow.name}". The workflow currently has ${workflow.nodes.length} nodes and ${Object.keys(workflow.connections).length} connections. What would you like me to remove?`;
    }
    
    if (lowerPrompt.includes('test') || lowerPrompt.includes('execute') || lowerPrompt.includes('testar') || lowerPrompt.includes('executar')) {
      return `I can help you test "${workflow.name}". The workflow is ready for execution with ${workflow.nodes.length} nodes. Would you like me to show you how to test it or make any adjustments before running?`;
    }
    
    if (lowerPrompt.includes('export') || lowerPrompt.includes('save') || lowerPrompt.includes('exportar') || lowerPrompt.includes('salvar')) {
      return `"${workflow.name}" can be exported as a JSON file. The workflow contains ${workflow.nodes.length} nodes and is fully configured. Would you like me to help you export it or make any final adjustments?`;
    }
    
    // Resposta genérica contextual
    return `I understand you want to discuss "${prompt}" in relation to your workflow "${workflow.name}". This workflow currently has ${workflow.nodes.length} nodes and ${Object.keys(workflow.connections).length} connections. How can I help you with this specific aspect?`;
  };

  const handleUpdateWorkflow = async (updatedWorkflow: Workflow) => {
    if (!user) return;
    
    try {
      const savedWorkflow = await saveWorkflow(updatedWorkflow);
      setCurrentWorkflow(savedWorkflow);
              showSuccessToast('Workflow updated successfully!', 'workflow-updated');
    } catch (error) {
              showErrorToast('Error updating workflow. Please try again.', 'workflow-update-error');
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
              showSuccessToast('Workflow deleted successfully!', 'workflow-deleted');
    } catch (error) {
              showErrorToast('Error deleting workflow. Please try again.', 'workflow-delete-error');
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

  const handleViewChange = (newView: ViewType) => {
    if (newView === view) return;
    navigateToView(newView);
  };

  const handleGetStarted = () => {
    setAuthModal(true);
  };



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
                isLoading={isLoading || isRestoring}
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
      
      {/* Toast Container para notificações */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;