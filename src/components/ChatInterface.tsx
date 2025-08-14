import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Message, Workflow } from '../types';
import { Send, Loader2, Bot, User, GitBranch } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  currentWorkflow?: Workflow | null;
}

export const ChatInterface = memo(function ChatInterface({ 
  messages, 
  isLoading, 
  onSendMessage, 
  currentWorkflow 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput('');
  }, [input, isLoading, onSendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  const suggestions = [
    "Create a workflow to sync data between systems",
    "Automate email notifications based on events",
    "Process API data and save to database",
    "Integrate Slack with ticketing system",
    "Monitor website and send alerts if down"
  ];

  return (
    <div className="h-full flex flex-col bg-white">
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
                Try these examples
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
                      {currentWorkflow.edges.length} edges
                    </span>
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                      {new Date(currentWorkflow.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <button
                    onClick={() => handleSuggestionClick("Add a new node to handle errors")}
                    className="text-left p-3 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">Add error handling to this workflow</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Add email notifications when the workflow completes")}
                    className="text-left p-3 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">Add email notifications</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Optimize this workflow for better performance")}
                    className="text-left p-3 card hover:shadow-sm transition-shadow duration-200"
                  >
                    <p className="text-sm text-primary">Optimize workflow performance</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-accent text-white'
                      : 'card'
                  }`}
                >
                  <p className={`text-sm ${
                    message.type === 'user' ? 'text-white' : 'text-primary'
                  }`}>
                    {message.content}
                  </p>
                  
                  {message.workflow && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-green-800 text-sm">
                            Workflow Generated!
                          </h4>
                          <p className="text-green-600 text-xs">
                            {message.workflow.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-green-700 bg-green-100 px-2 py-1 rounded">
                          {message.workflow.nodes.length} nodes
                        </span>
                        <span className="text-green-700 bg-green-100 px-2 py-1 rounded">
                          {message.workflow.edges.length} edges
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span className="text-sm text-secondary">Creating your workflow...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentWorkflow 
                ? "Ask for modifications or improvements to this workflow..."
                : "Describe the workflow you want to create..."
              }
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white text-primary placeholder-secondary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-accent hover:bg-[#E63E6B] disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});