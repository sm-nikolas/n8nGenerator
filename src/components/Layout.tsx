import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ChatInterface } from './ChatInterface';
import { WorkflowCanvas } from './WorkflowCanvas';
import { PreviewPanel } from './PreviewPanel';
import { Workflow } from '../types';

interface LayoutProps {
  user: any;
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  messages: any[];
  isLoading: boolean;
  sidebarOpen: boolean;
  view: 'chat' | 'workflow' | 'preview';
  onToggleSidebar: () => void;
  onViewChange: (view: 'chat' | 'workflow' | 'preview') => void;
  onSelectWorkflow: (workflow: Workflow) => void;
  onNewWorkflow: () => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onUpdateWorkflow: (workflow: Workflow) => void;
  onSendMessage: (message: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  workflows,
  currentWorkflow,
  messages,
  isLoading,
  sidebarOpen,
  view,
  onToggleSidebar,
  onViewChange,
  onSelectWorkflow,
  onNewWorkflow,
  onDeleteWorkflow,
  onUpdateWorkflow,
  onSendMessage,
}) => {
  return (
    <div className="h-screen flex flex-col bg-[#101330]">
      <Header 
        user={user}
        onToggleSidebar={onToggleSidebar}
        activeView={view}
        onViewChange={onViewChange}
        currentWorkflow={currentWorkflow}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <Sidebar 
            workflows={workflows}
            currentWorkflow={currentWorkflow}
            onSelectWorkflow={onSelectWorkflow}
            onNewWorkflow={onNewWorkflow}
            onDeleteWorkflow={onDeleteWorkflow}
          />
        )}
        
        <div className="flex-1 flex">
          {(view === 'chat' || !currentWorkflow) && (
            <div className="flex-1">
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                onSendMessage={onSendMessage}
                currentWorkflow={currentWorkflow}
              />
            </div>
          )}
          
          {view === 'workflow' && currentWorkflow && (
            <div className="flex-1">
              <WorkflowCanvas
                workflow={currentWorkflow}
                onUpdateWorkflow={onUpdateWorkflow}
              />
            </div>
          )}
          
          {view === 'preview' && currentWorkflow && (
            <div className="flex-1">
              <PreviewPanel workflow={currentWorkflow} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
