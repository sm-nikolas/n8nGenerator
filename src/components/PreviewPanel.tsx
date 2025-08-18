import React, { useState, useCallback, memo } from 'react';
import { Workflow } from '../types';
import { toast } from 'react-toastify';
import { Copy, Check, Download, Eye, Code2, FileText } from 'lucide-react';

interface PreviewPanelProps {
  workflow: Workflow;
}

export const PreviewPanel = memo(function PreviewPanel({ workflow }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'yaml' | 'xml'>('json');

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Error copying to clipboard. Please try again.');
    }
  }, []);

  const downloadWorkflow = useCallback(async (format: 'json' | 'yaml' | 'xml') => {
    let content = '';
    const filename = `workflow-${workflow.id}.${format}`;
    
    if (format === 'json') {
      content = JSON.stringify(workflow, null, 2);
    } else if (format === 'yaml') {
      content = `# ${workflow.name}\n# ${workflow.description}\n\nworkflow:\n  id: ${workflow.id}\n  name: ${workflow.name}\n  description: ${workflow.description}\n  nodes: ${workflow.nodes.length}\n  connections: ${Object.keys(workflow.connections).length}`;
    } else if (format === 'xml') {
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<workflow id="${workflow.id}" name="${workflow.name}">\n  <description>${workflow.description}</description>\n  <nodes count="${workflow.nodes.length}" />\n  <connections count="${Object.keys(workflow.connections).length}" />\n</workflow>`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [workflow]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB]">
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF4F79] rounded-lg flex items-center justify-center">
              {activeTab === 'json' ? (
                <Eye className="h-4 w-4 text-white" />
              ) : (
                <Code2 className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#101330]">{workflow.name}</h2>
              <p className="text-sm text-[#6B7280]">{workflow.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'json'
                    ? 'bg-[#FF4F79] text-white'
                    : 'text-[#6B7280] hover:text-[#101330]'
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('yaml')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'yaml'
                    ? 'bg-[#FF4F79] text-white'
                    : 'text-[#6B7280] hover:text-[#101330]'
                }`}
              >
                <Code2 className="h-4 w-4" />
                YAML
              </button>
            </div>
            
            <button
              onClick={() => copyToClipboard(JSON.stringify(workflow, null, 2))}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-[#101330] font-medium rounded-lg transition-colors border border-gray-200 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
            
            <button
              onClick={() => downloadWorkflow('json')}
              className="px-4 py-2 bg-[#FF4F79] hover:bg-[#E63E6B] text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {activeTab === 'json' ? (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="card p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">{workflow.name}</h3>
                  <p className="text-sm text-secondary mb-2">{workflow.description}</p>
                  <div className="flex gap-4 text-xs">
                    <span className="text-accent bg-accent/10 px-2 py-1 rounded">
                      {workflow.nodes.length} nodes
                    </span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {Object.keys(workflow.connections).length} connections
                    </span>
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                      {formatDate(workflow.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Workflow Nodes</h3>
              
              {workflow.nodes.map((node, index) => (
                <div key={node.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent text-white rounded-lg flex items-center justify-center font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-primary">{node.name}</h4>
                        <p className="text-sm text-secondary">{node.type}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-primary">Position:</span>
                      <span className="text-secondary ml-2">x: {node.position.x}, y: {node.position.y}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-primary">Parameters:</span>
                      <span className="text-secondary ml-2">{JSON.stringify(node.parameters)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              {activeTab === 'yaml' ? 
                `# ${workflow.name}\n# ${workflow.description}\n\nworkflow:\n  id: ${workflow.id}\n  name: ${workflow.name}\n  description: ${workflow.description}\n  nodes: ${workflow.nodes.length}\n  connections: ${Object.keys(workflow.connections).length}` :
                `<?xml version="1.0" encoding="UTF-8"?>\n<workflow id="${workflow.id}" name="${workflow.name}">\n  <description>${workflow.description}</description>\n  <nodes count="${workflow.nodes.length}" />\n  <connections count="${Object.keys(workflow.connections).length}" />\n</workflow>`
              }
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});