import React, { memo } from 'react';
import { Workflow } from '../types'; // Removido Conversation
import { Plus, Clock, GitBranch, Trash2, Zap, Database, Mail } from 'lucide-react';

interface SidebarProps {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow) => void;
  onNewWorkflow: () => void;
  onDeleteWorkflow: (workflowId: string) => void;
}

export const Sidebar = memo(function Sidebar({ 
  workflows, 
  currentWorkflow, 
  onSelectWorkflow, 
  onNewWorkflow, 
  onDeleteWorkflow
}: SidebarProps) {
  const formatDate = React.useCallback((date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  }, []);

  const handleDeleteClick = React.useCallback((e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow?')) {
      onDeleteWorkflow(workflowId);
    }
  }, [onDeleteWorkflow]);

  const handleWorkflowSelect = React.useCallback((workflow: Workflow) => {
    onSelectWorkflow(workflow);
  }, [onSelectWorkflow]);

  const templates = [
    {
      name: 'API Integration',
      description: 'Connect external APIs',
      icon: Zap,
      color: 'bg-blue-500'
    },
    {
      name: 'Data Processing',
      description: 'Transform data automatically',
      icon: Database,
      color: 'bg-green-500'
    },
    {
      name: 'Email Automation',
      description: 'Automated notifications',
      icon: Mail,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="w-80 bg-[#F9FAFB] border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewWorkflow}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">Recent Workflows</h3>
            
            {workflows.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-3">
                  <GitBranch className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-sm font-medium text-primary mb-1">No workflows yet</h4>
                <p className="text-xs text-secondary">Start a conversation to create your first workflow</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    onClick={() => handleWorkflowSelect(workflow)}
                    className={`group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                      currentWorkflow?.id === workflow.id
                        ? 'card border-accent shadow-lg bg-accent/10 ring-1 ring-accent/20'
                        : 'card hover:shadow-md hover:border-gray-300'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-primary truncate text-sm">
                            {workflow.name}
                          </h4>
                          <p className="text-xs text-secondary line-clamp-2 mt-1">
                            {workflow.description}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteClick(e, workflow.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-accent hover:bg-red-50 rounded transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-secondary">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs text-gray-500">
                            {formatDate(new Date(workflow.updatedAt))}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {workflow.nodes.length} nodes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">Templates</h3>
            
            <div className="space-y-2">
              {templates.map((template, index) => (
                <div
                  key={index}
                  className="card p-3 cursor-pointer hover:shadow-sm transition-shadow duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${template.color} rounded-lg flex items-center justify-center`}>
                      <template.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-primary text-sm">
                        {template.name}
                      </h4>
                      <p className="text-xs text-secondary">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});