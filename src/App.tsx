import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './hooks/useAuth';
import { useWorkflows } from './hooks/useWorkflows';
import { useMessages } from './hooks/useMessages';
import { useAppState } from './hooks/useAppState';
import { ViewType } from './hooks/useRouter';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { GoogleAuthCallback } from './components/GoogleAuthCallback';
import { Message, Workflow } from './types'; // Removido Conversation
import { supabase } from './lib/supabase';

// Função para gerar workflow mock
const generateMockWorkflow = (prompt: string): Workflow => {
  const workflowId = uuidv4();
  
  // Analisar o prompt para determinar o tipo de workflow
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('qualificar') || lowerPrompt.includes('lead') || lowerPrompt.includes('cnpj')) {
    return generateLeadQualificationWorkflow(workflowId, prompt);
  } else if (lowerPrompt.includes('email') || lowerPrompt.includes('notificação')) {
    return generateEmailWorkflow(workflowId, prompt);
  } else if (lowerPrompt.includes('api') || lowerPrompt.includes('integração')) {
    return generateApiIntegrationWorkflow(workflowId, prompt);
  } else {
    return generateBasicWorkflow(workflowId, prompt);
  }
};

// Workflow de qualificação de leads
const generateLeadQualificationWorkflow = (workflowId: string, prompt: string): Workflow => {
  return {
    id: workflowId,
    name: `Qualificação de Leads`,
    description: `Workflow para qualificar leads automaticamente baseado em: ${prompt}`,
    nodes: [
      {
        id: "Webhook",
        name: "Entrada Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: { x: 100, y: 300 },
        parameters: {
          path: "qualificar-lead",
          method: "POST",
          responseMode: "onReceived"
        }
      },
      {
        id: "Formatar CNPJ",
        name: "Limpar CNPJ",
        type: "n8n-nodes-base.function",
        position: { x: 300, y: 300 },
        parameters: {
          functionCode: "// Limpar e formatar CNPJ\nconst cnpj = $json.cnpj.replace(/\\D/g, '');\nreturn [{ json: { ...$json, cnpj } }];"
        }
      },
      {
        id: "ReceitaWS",
        name: "ReceitaWS",
        type: "n8n-nodes-base.httpRequest",
        position: { x: 500, y: 100 },
        parameters: {
          url: "https://www.receitaws.com.br/v1/cnpj={{$json.cnpj}}",
          method: "GET",
          responseFormat: "json"
        }
      },
      {
        id: "DeepSeek",
        name: "Classificar com IA",
        type: "n8n-nodes-base.httpRequest",
        position: { x: 700, y: 300 },
        parameters: {
          url: "https://api.deepseek.com/v1/chat/completions",
          method: "POST",
          responseFormat: "json",
          headers: {
            "Authorization": "Bearer SUA_DEEPSEEK_API_KEY",
            "Content-Type": "application/json"
          }
        }
      },
      {
        id: "Retorno",
        name: "Retornar Resultado",
        type: "n8n-nodes-base.set",
        position: { x: 900, y: 300 },
        parameters: {
          values: {
            json: {
              nome: "={{$json.nome}}",
              cnpj: "={{$json.cnpj}}",
              score: "={{$json.score}}"
            }
          }
        }
      }
    ],
    connections: {
      "Entrada Webhook": {
        main: [[{ node: "Limpar CNPJ", type: "main", index: 0 }]]
      },
      "Limpar CNPJ": {
        main: [[{ node: "ReceitaWS", type: "main", index: 0 }]]
      },
      "ReceitaWS": {
        main: [[{ node: "Classificar com IA", type: "main", index: 0 }]]
      },
      "Classificar com IA": {
        main: [[{ node: "Retornar Resultado", type: "main", index: 0 }]]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: ''
  };
};

// Workflow de email
const generateEmailWorkflow = (workflowId: string, prompt: string): Workflow => {
  return {
    id: workflowId,
    name: `Automação de Email`,
    description: `Workflow para automação de emails baseado em: ${prompt}`,
    nodes: [
      {
        id: "Trigger",
        name: "Manual Trigger",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: { x: 100, y: 300 },
        parameters: {}
      },
      {
        id: "Gmail",
        name: "Enviar Email",
        type: "n8n-nodes-base.gmail",
        position: { x: 300, y: 300 },
        parameters: {
          operation: "send",
          subject: "Notificação Automática",
          message: "Este é um email enviado automaticamente pelo workflow."
        }
      }
    ],
    connections: {
      "Manual Trigger": {
        main: [[{ node: "Enviar Email", type: "main", index: 0 }]]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: ''
  };
};

// Workflow de integração API
const generateApiIntegrationWorkflow = (workflowId: string, prompt: string): Workflow => {
  return {
    id: workflowId,
    name: `Integração API`,
    description: `Workflow para integração com APIs baseado em: ${prompt}`,
    nodes: [
      {
        id: "Webhook",
        name: "Webhook Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: { x: 100, y: 300 },
        parameters: {
          path: "api-integration",
          method: "POST"
        }
      },
      {
        id: "HTTP Request",
        name: "Chamada API",
        type: "n8n-nodes-base.httpRequest",
        position: { x: 300, y: 300 },
        parameters: {
          url: "https://api.exemplo.com/endpoint",
          method: "GET",
          responseFormat: "json"
        }
      },
      {
        id: "Set",
        name: "Processar Dados",
        type: "n8n-nodes-base.set",
        position: { x: 500, y: 300 },
        parameters: {
          values: {
            json: {
              processedData: "={{$json.data}}"
            }
          }
        }
      }
    ],
    connections: {
      "Webhook Trigger": {
        main: [[{ node: "Chamada API", type: "main", index: 0 }]]
      },
      "Chamada API": {
        main: [[{ node: "Processar Dados", type: "main", index: 0 }]]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: ''
  };
};

// Workflow básico
const generateBasicWorkflow = (workflowId: string, prompt: string): Workflow => {
  return {
    id: workflowId,
    name: `Workflow Personalizado`,
    description: `Automated workflow generated from: ${prompt}`,
    nodes: [
      {
        id: "Manual Trigger",
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: { x: 100, y: 300 },
        parameters: {}
      },
      {
        id: "HTTP Request",
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 300, y: 300 },
        parameters: {
          url: 'https://api.exemplo.com',
          method: 'GET'
        }
      }
    ],
    connections: {
      "Manual Trigger": {
        main: [[{ node: "HTTP Request", type: "main", index: 0 }]]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: ''
  };
};

function App() {
  const { user, loading: authLoading } = useAuth();
  const { workflows, saveWorkflow, deleteWorkflow } = useWorkflows(user?.id);
  const { messages, saveMessage, clearMessages, fetchMessagesForWorkflow, addMessageToState } = useMessages(user?.id);
  
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
        toast.error('Erro ao atualizar mensagem. Tente novamente.');
      }
    } catch (error) {
      toast.error('Erro ao atualizar mensagem. Tente novamente.');
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
        const workflow = generateMockWorkflow(prompt);
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
             toast.error('Erro ao processar sua solicitação. Tente novamente.');
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
      return `I can help you add new functionality to "${workflow.name}". Based on your request, I suggest adding nodes for the functionality you mentioned. The current workflow has ${workflow.nodes.length} nodes. Would you like me to show you how to implement this?`;
    }
    
    if (lowerPrompt.includes('modify') || lowerPrompt.includes('change') || lowerPrompt.includes('modificar') || lowerPrompt.includes('alterar')) {
      return `I can help you modify "${workflow.name}". The current workflow has ${workflow.nodes.length} nodes. What specific changes would you like me to make?`;
    }
    
    if (lowerPrompt.includes('explain') || lowerPrompt.includes('how') || lowerPrompt.includes('explicar') || lowerPrompt.includes('como')) {
      return `Let me explain how "${workflow.name}" works: This workflow starts with a ${workflow.nodes[0]?.name || 'trigger'} node and processes data through ${workflow.nodes.length} nodes. Each node performs a specific function in the automation process. The workflow uses n8n's standard node types for maximum compatibility.`;
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
      toast.success('Workflow atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar workflow. Tente novamente.');
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
      toast.success('Workflow deletado com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar workflow. Tente novamente.');
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