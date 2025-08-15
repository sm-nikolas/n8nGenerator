import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Message, Workflow } from '../types';
import { Send, Loader2, Bot, User, GitBranch } from 'lucide-react';
import { User as UserType } from '@supabase/supabase-js';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  currentWorkflow?: Workflow | null;
  user: UserType;
}

export const ChatInterface = memo(function ChatInterface({ 
  messages, 
  isLoading, 
  onSendMessage, 
  currentWorkflow,
  user
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [textareaHeight, setTextareaHeight] = useState(48);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Função para obter a foto do usuário do Google OAuth
  const getUserAvatar = useCallback(() => {
    // Check user_metadata first (Google OAuth data)
    if (user.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    // Fallback to app_metadata
    if (user.app_metadata?.provider === 'google' && user.app_metadata?.avatar_url) {
      return user.app_metadata.avatar_url;
    }
    // Fallback to picture field (common in OAuth)
    if (user.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    return null;
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focar no input quando isLoading mudar de true para false (resposta do robô retornou)
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      // Pequeno delay para garantir que a mensagem foi renderizada
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isLoading]);

  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(48, textarea.scrollHeight), 120);
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Ajustar posição do botão para centralização perfeita
      const button = textarea.parentElement?.querySelector('button');
      if (button) {
        const buttonHeight = 32; // h-8 = 32px
        const topPosition = (newHeight - buttonHeight) / 2;
        (button as HTMLElement).style.top = `${topPosition}px`;
        (button as HTMLElement).style.transform = 'none';
      }
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput('');
    setTextareaHeight(48);
    if (inputRef.current) {
      inputRef.current.style.height = '48px';
      
      // Reposicionar o botão para a nova altura
      const button = inputRef.current.parentElement?.querySelector('button');
      if (button) {
        const buttonHeight = 32; // h-8 = 32px
        const topPosition = (48 - buttonHeight) / 2; // 48px é a altura padrão
        (button as HTMLElement).style.top = `${topPosition}px`;
      }
    }
  }, [input, isLoading, onSendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  // Função para renderizar uma mensagem individual
  const renderMessage = useCallback((message: Message) => {
    const userAvatar = getUserAvatar();
    
    return (
      <div
        key={message.id}
        className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        {message.type === 'assistant' && (
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
        
        <div
          className={`max-w-[70%] px-4 py-2.5 ${
            message.type === 'user'
              ? 'bg-accent text-white rounded-[18px] rounded-tr-[6px]'
              : 'card text-primary rounded-[18px] rounded-tl-[6px]'
          }`}
        >
                           <div className={`text-sm leading-relaxed ${
                   message.type === 'user' ? 'text-white' : 'text-primary'
                 }`}>
                   {message.content.split('\n').map((line, index) => (
                     <React.Fragment key={index}>
                       {line}
                       {index < message.content.split('\n').length - 1 && <br />}
                     </React.Fragment>
                   ))}
                 </div>
          
          {message.workflow && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                  <Bot className="h-2.5 w-2.5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 text-xs">
                    Workflow Generated!
                  </h4>
                  <p className="text-green-600 text-xs">
                    {message.workflow.name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  {message.workflow.nodes.length} nodes
                </span>
                <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  {message.workflow.edges.length} edges
                </span>
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs opacity-50 flex items-center justify-end">
            <span>
              {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
        
        {message.type === 'user' && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center hidden">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  }, [getUserAvatar]);

  const suggestions = [
    "Create a workflow to sync data between systems",
    "Automate email notifications based on events",
    "Process API data and save to database",
    "Integrate Slack with ticketing system",
    "Monitor website and send alerts if down"
  ];

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-2xl">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6">
              <Bot className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-primary mb-2">
              {currentWorkflow ? `Editing: ${currentWorkflow.name}` : 'Welcome to N8N Flow AI'}
            </h2>
            <p className="text-secondary mb-8 max-w-md">
              {currentWorkflow 
                ? 'Continue the conversation about this workflow or ask for modifications'
                : "Describe what you want to automate and I'll create a complete n8n workflow for you"
              }
            </p>
            
            {!currentWorkflow && (
            <div className="w-full max-w-2xl">
              <h3 className="text-sm font-semibold text-primary mb-4">
                Try these examples to create your first workflow
              </h3>
              
              <div className="grid gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left p-4 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">
                      {suggestion}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            )}
            
            {currentWorkflow && (
              <div className="w-full max-w-2xl">
                <div className="card p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <GitBranch className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{currentWorkflow.name}</h3>
                      <p className="text-sm text-secondary">{currentWorkflow.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-accent bg-accent/10 px-2 py-1 rounded">
                      {currentWorkflow.nodes.length} nodes
                    </span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {Object.keys(currentWorkflow.connections).length} connections
                    </span>
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                      {new Date(currentWorkflow.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <button
                    onClick={() => handleSuggestionClick("Add error handling to this workflow")}
                    className="text-left p-3 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">Add error handling to this workflow</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Add email notifications when this workflow completes")}
                    className="text-left p-3 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">Add email notifications</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("How can I optimize this workflow for better performance?")}
                    className="text-left p-3 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">Optimize workflow performance</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Explain how this workflow works step by step")}
                    className="text-left p-3 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">Explain how this workflow works</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 px-4 space-y-4">
            {messages.map(renderMessage)}
            
                          
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
                         <textarea
               value={input}
               onChange={handleInputChange}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                   e.preventDefault();
                   handleSubmit(e)
                 }
               }}
               placeholder={currentWorkflow 
                 ? "Ask for modifications or improvements to this workflow..."
                 : "Describe the workflow you want to create..."
               }
               className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white text-primary placeholder-secondary resize-none"
               style={{ 
                 height: `${textareaHeight}px`,
                 overflowY: textareaHeight >= 120 ? 'auto' : 'hidden'
               }}
               disabled={isLoading}
               ref={inputRef}
               rows={1}
             />
                               <button
                     type="submit"
                     disabled={!input.trim() || isLoading}
                     className="absolute right-4 w-8 h-8 bg-accent hover:bg-[#E63E6B] disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center"
                     style={{
                       top: '8px'
                     }}
                   >
                     <Send className="h-4 w-4" />
                   </button>
          </div>
        </form>
      </div>
    </div>
  );
});