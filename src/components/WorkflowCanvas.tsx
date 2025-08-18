import React, { useCallback, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  useReactFlow,
  Position,
  ReactFlowProvider,
  Handle,
  MarkerType
} from '@xyflow/react';
import { Workflow } from '../types';
import { RotateCcw, GitBranch } from 'lucide-react';
import '@xyflow/react/dist/style.css';

interface WorkflowCanvasProps {
  workflow: Workflow;
}

// Mapeamento de cores por categoria de node
const nodeColors: Record<string, string> = {
  'webhook': '#FF6B6B',      // Vermelho para webhooks
  'trigger': '#FF6B6B',      // Vermelho para triggers
  'function': '#4ECDC4',     // Verde para funções
  'httpRequest': '#96CEB4',  // Verde claro para HTTP
  'search': '#45B7D1',       // Azul para busca
  'set': '#FFEAA7',          // Amarelo para set
  'action': '#4ECDC4',       // Verde para ações
  'format': '#FFEAA7',       // Amarelo para formatação
  'build': '#DDA0DD',        // Roxo para build
  'api': '#45B7D1',          // Azul para API
  'gmail': '#FF8C42',        // Laranja para email
  'default': '#6C5CE7'       // Roxo escuro para outros
};

// Função para determinar a cor baseada no tipo do node
function getNodeColor(nodeType: string): string {
  const lowerType = nodeType.toLowerCase();
  
  if (lowerType.includes('webhook')) return nodeColors.webhook;
  if (lowerType.includes('trigger')) return nodeColors.trigger;
  if (lowerType.includes('function')) return nodeColors.function;
  if (lowerType.includes('http')) return nodeColors.httpRequest;
  if (lowerType.includes('search')) return nodeColors.search;
  if (lowerType.includes('set')) return nodeColors.set;
  if (lowerType.includes('action')) return nodeColors.action;
  if (lowerType.includes('format')) return nodeColors.format;
  if (lowerType.includes('build')) return nodeColors.build;
  if (lowerType.includes('api')) return nodeColors.api;
  if (lowerType.includes('gmail') || lowerType.includes('email')) return nodeColors.gmail;
  
  return nodeColors.default;
}

// Custom Node Component with proper handles
const CustomNode = ({ data }: { data: any }) => {
  const nodeColor = getNodeColor(data.type);
  
  return (
    <div 
      className="bg-white border-2 rounded-lg shadow-lg min-w-[200px]"
      style={{ borderColor: nodeColor }}
    >
      {/* Header do node */}
      <div 
        className="px-3 py-2 rounded-t-lg text-white font-medium text-sm flex items-center gap-2"
        style={{ backgroundColor: nodeColor }}
      >
        <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
        {data.displayName || data.name}
      </div>
      
      {/* Corpo do node */}
      <div className="p-3">
        <div className="text-sm font-semibold text-gray-800 mb-2">
          {data.name}
        </div>
        
        {/* Informações do node */}
        {data.parameters && Object.keys(data.parameters).length > 0 && (
          <div className="space-y-1">
            {Object.entries(data.parameters).slice(0, 3).map(([key, value]: [string, any]) => (
              <div key={key} className="text-xs text-gray-600">
                <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}
                {String(value).length > 30 && '...'}
              </div>
            ))}
            {Object.keys(data.parameters).length > 3 && (
              <div className="text-xs text-gray-500 italic">
                +{Object.keys(data.parameters).length - 3} mais...
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Handles de conexão */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ right: -6 }}
      />
    </div>
  );
};

export const WorkflowCanvas = React.memo(function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
  if (!workflow) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Nenhum workflow fornecido</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent workflow={workflow} />
    </ReactFlowProvider>
  );
});

// Componente interno que usa os hooks do React Flow
const WorkflowCanvasContent = ({ workflow }: WorkflowCanvasProps) => {
  const { fitView, setViewport } = useReactFlow();
  
  // Convert workflow nodes to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    if (!workflow || !workflow.nodes) {
      return [];
    }
    
    const nodes = workflow.nodes.map(node => {
      // Ensure position has valid coordinates
      const position = {
        x: typeof node.position?.x === 'number' ? node.position.x : 0,
        y: typeof node.position?.y === 'number' ? node.position.y : 0
      };
      
      return {
        id: node.id,
        type: 'custom',
        position,
        data: {
          ...node,
          displayName: node.name,
          parameters: node.parameters || {}
        }
      };
    });
    
    return nodes;
  }, [workflow?.nodes]);

  // Convert workflow connections to React Flow edges using native format
  const initialEdges: Edge[] = useMemo(() => {
    if (!workflow || !workflow.connections) {
      return [];
    }
    
    const edges: Edge[] = [];
    
    Object.entries(workflow.connections).forEach(([sourceNodeName, outputs]) => {
      const sourceNode = workflow.nodes.find(n => n.name === sourceNodeName);
      if (!sourceNode) {
        return;
      }
      
      if (outputs.main && Array.isArray(outputs.main)) {
        outputs.main.forEach((mainConnections, outputIndex) => {
          if (Array.isArray(mainConnections)) {
            mainConnections.forEach((connection, connectionIndex) => {
              const targetNode = workflow.nodes.find(n => n.name === connection.node);
              if (!targetNode) {
                return;
              }
              
              const edgeKey = `${sourceNode.id}-${targetNode.id}-${outputIndex}-${connectionIndex}`;
              
              edges.push({
                id: edgeKey,
                source: sourceNode.id,
                target: targetNode.id,
                type: 'default', // Use default edge type
                animated: true,
                style: { stroke: '#6B7280', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: '#6B7280',
                },
              });
            });
          }
        });
      }
    });

    return edges;
  }, [workflow?.nodes, workflow?.connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when workflow changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  // Handle new connections using native React Flow
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        type: 'default',
        animated: true,
        style: { stroke: '#6B7280', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6B7280',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    custom: CustomNode
  }), []);

  // Handle zoom controls
  const handleResetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  const handleCenterOnNodes = useCallback(() => {
    fitView({ padding: 0.1 });
  }, [fitView]);

  // Show loading state if no nodes
  if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4F79] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando workflow...</p>
          <p className="text-sm text-gray-500 mt-2">
            {!workflow ? 'Nenhum workflow fornecido' : 
             !workflow.nodes ? 'Workflow sem nós' : 
             `Workflow com ${workflow.nodes.length} nós`}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if no nodes after conversion
  if (initialNodes.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao converter nós</p>
          <p className="text-sm text-gray-500">Verifique o console para mais detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#F9FAFB]">
      {/* Header - Exatamente igual ao PreviewPanel */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF4F79] rounded-lg flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#101330]">{workflow.name}</h2>
              <p className="text-sm text-[#6B7280]">{workflow.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 rounded-lg p-1 border border-gray-200">
              <button
                onClick={handleResetView}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 text-[#6B7280] hover:text-[#101330]"
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleCenterOnNodes}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 text-[#6B7280] hover:text-[#101330]"
                title="Center on Nodes"
              >
                <GitBranch className="h-4 w-4" />
                Center
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-50"
          defaultEdgeOptions={{
            type: 'default',
            animated: true,
            style: { stroke: '#6B7280', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#6B7280',
            },
          }}
          // Modo somente leitura
          // nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          preventScrolling={false}
        >
          {/* Background Grid */}
          <Background 
            gap={20} 
            size={1} 
            bgColor="#E5E7EB"
          />
          
          {/* Controls */}
          <Controls 
            showZoom={false}
            showFitView={false}
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </div>
  );
};