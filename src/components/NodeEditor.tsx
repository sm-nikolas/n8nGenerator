import React, { useState, useCallback, memo } from 'react';
import { WorkflowNode } from '../types';
import { X, Save, Settings } from 'lucide-react';

interface NodeEditorProps {
  node: WorkflowNode;
  onClose: () => void;
  onUpdate: (node: WorkflowNode) => void;
}

export const NodeEditor = memo(function NodeEditor({ node, onClose, onUpdate }: NodeEditorProps) {
  const [editedNode, setEditedNode] = useState<WorkflowNode>({ ...node });

  const handleDataChange = useCallback((key: string, value: any) => {
    setEditedNode(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(editedNode);
  }, [editedNode, onUpdate]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedNode(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handlePositionXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedNode(prev => ({
      ...prev,
      position: { x: parseFloat(e.target.value), y: prev.position.y }
    }));
  }, []);

  const handlePositionYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedNode(prev => ({
      ...prev,
      position: { x: prev.position.x, y: parseFloat(e.target.value) }
    }));
  }, []);

  const renderDataInput = useCallback((key: string, value: any) => {
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleDataChange(key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
          />
        </div>
      );
    }
    
    if (typeof value === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleDataChange(key, parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
        />
      );
    }
    
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleDataChange(key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      />
    );
  }, [handleDataChange]);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-primary">Node Editor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-4 w-4 text-secondary" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        <div className="card p-4">
          <label className="block text-sm font-medium text-primary mb-2">
            Node Name
          </label>
          <input
            type="text"
            value={editedNode.name}
            onChange={handleNameChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        
        <div className="card p-4">
          <label className="block text-sm font-medium text-primary mb-2">
            Node Type
          </label>
          <input
            type="text"
            value={editedNode.type}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-secondary"
          />
        </div>
        
        <div className="card p-4">
          <h4 className="text-sm font-medium text-primary mb-3">
            Parameters
          </h4>
          <div className="space-y-3">
            {Object.entries(editedNode.data).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-primary mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                {renderDataInput(key, value)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="card p-4">
          <h4 className="text-sm font-medium text-primary mb-3">
            Position
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">X</label>
              <input
                type="number"
                value={editedNode.position.x}
                onChange={handlePositionXChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Y</label>
              <input
                type="number"
                value={editedNode.position.y}
                onChange={handlePositionYChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
});