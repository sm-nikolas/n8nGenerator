import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { Workflow, WorkflowNode } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, GitBranch, Zap, Code, Globe, Search, FileText, Settings } from 'lucide-react';

interface WorkflowCanvasProps {
  workflow: Workflow;
  onUpdateWorkflow: (workflow: Workflow) => void;
}

export const WorkflowCanvas = memo(function WorkflowCanvas({ workflow, onUpdateWorkflow }: WorkflowCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Use refs to avoid unnecessary re-renders during pan/zoom
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Initialize node positions ref
  useEffect(() => {
    const positions = new Map();
    workflow.nodes.forEach(node => {
      positions.set(node.id, { ...node.position });
    });
    nodePositionsRef.current = positions;
  }, [workflow.nodes]);

  const nodeTypes = useMemo(() => ({
    'webhook': {
      name: 'Webhook',
      color: 'bg-blue-600',
      icon: <Zap className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: true
    },
    'function': {
      name: 'Function',
      color: 'bg-purple-600',
      icon: <Code className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'httpRequest': {
      name: 'HTTP Request',
      color: 'bg-green-600',
      icon: <Globe className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'search': {
      name: 'Search',
      color: 'bg-indigo-600',
      icon: <Search className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'set': {
      name: 'Set',
      color: 'bg-orange-600',
      icon: <FileText className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'trigger': {
      name: 'Manual Trigger',
      color: 'bg-red-600',
      icon: <Zap className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: true
    },
    'action': {
      name: 'Action',
      color: 'bg-purple-600',
      icon: <Settings className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'format': {
      name: 'Format Data',
      color: 'bg-yellow-600',
      icon: <Code className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'build': {
      name: 'Build Request',
      color: 'bg-teal-600',
      icon: <Settings className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'api': {
      name: 'API Call',
      color: 'bg-purple-600',
      icon: <Globe className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'gmail': {
      name: 'Gmail',
      color: 'bg-red-600',
      icon: <FileText className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
    'slack': {
      name: 'Slack',
      color: 'bg-indigo-600',
      icon: <FileText className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    },
  }), []);

  const getNodeType = useCallback((type: string) => {
    // Map n8n node types exactly as in the JSON
    if (type.includes('n8n-nodes-base.webhook')) return nodeTypes.webhook;
    if (type.includes('n8n-nodes-base.function')) return nodeTypes.function;
    if (type.includes('n8n-nodes-base.httpRequest')) return nodeTypes.httpRequest;
    if (type.includes('n8n-nodes-base.set')) return nodeTypes.set;
    
    // Fallback for other types
    return nodeTypes[type as keyof typeof nodeTypes] || {
      name: type.split('.').pop() || 'Unknown',
      color: 'bg-gray-600',
      icon: <Settings className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    };
  }, [nodeTypes]);

  const handleNodeClick = useCallback((node: WorkflowNode) => {
    // In read-only mode, just show basic info or do nothing
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      requestAnimationFrame(() => {
        setPan(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
      });
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      
      requestAnimationFrame(() => {
        setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
      });
    }
  }, []);

  // Memoize transform style to avoid recalculations
  const canvasTransform = useMemo(() => ({
    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
    transformOrigin: '0 0',
    willChange: isPanning ? 'transform' : 'auto'
  }), [pan.x, pan.y, zoom, isPanning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  // Enhanced edge rendering with n8n style (right-angled connections)
  const renderEdges = useMemo(() => {
    return workflow.edges.map((edge) => {
      const sourceNode = workflow.nodes.find(n => n.id === edge.source);
      const targetNode = workflow.nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const sourcePos = nodePositionsRef.current.get(sourceNode.id) || sourceNode.position;
      const targetPos = nodePositionsRef.current.get(targetNode.id) || targetNode.position;
      
      // Source node output point (right side)
      const sourceWidth = 160;
      const startX = sourcePos.x + sourceWidth;
      const startY = sourcePos.y + 40;
      
      // Target node input point (left side)
      const endX = targetPos.x;
      const endY = targetPos.y + 40;
      
      // Create right-angled path like n8n
      const pathData = createRightAngledPath(startX, startY, endX, endY);
      
      // Calculate arrow head
      const arrowSize = 6;
      const angle = Math.atan2(endY - startY, endX - startX);
      const arrowX = endX - arrowSize * Math.cos(angle);
      const arrowY = endY - arrowSize * Math.sin(angle);
      
      const arrowPath = `M ${arrowX} ${arrowY} L ${arrowX - arrowSize * Math.cos(angle - Math.PI/6)} ${arrowY - arrowSize * Math.sin(angle - Math.PI/6)} L ${arrowX - arrowSize * Math.cos(angle + Math.PI/6)} ${arrowY - arrowSize * Math.sin(angle + Math.PI/6)} Z`;
      
      return (
        <g key={edge.id} className="edge-group">
          {/* Main connection line - n8n style with right angles */}
          <path
            d={pathData}
            stroke="#606060"
            strokeWidth="2"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* Arrow head */}
          <path
            d={arrowPath}
            fill="#606060"
            className="drop-shadow-sm"
          />
        </g>
      );
    });
  }, [workflow.edges, workflow.nodes]);

  // Create right-angled path like n8n
  const createRightAngledPath = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2;
    
    // Create path with right angles: horizontal -> vertical -> horizontal
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  }, []);

  // Memoized individual node component with authentic n8n style
  const NodeComponent = useMemo(() => memo(({ 
    node, 
    nodeType, 
    isDragging, 
    isSelected, 
    onNodeClick
  }: {
    node: WorkflowNode;
    nodeType: any;
    isDragging: boolean;
    isSelected: boolean;
    onNodeClick: (node: WorkflowNode) => void;
  }) => {
    const nodeWidth = 160;
    const nodeHeight = 80;
    
    return (
      <div
        key={node.id}
        className={`absolute bg-white border border-gray-200 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 ${
          isSelected ? 'border-[#FF4F79] shadow-2xl ring-2 ring-[#FF4F79]/20' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: nodeWidth,
          height: nodeHeight,
          transition: 'all 0.2s ease-out',
        }}
        onClick={() => onNodeClick(node)}
      >
        {/* Node Header - n8n style with icon on the left */}
        <div className="px-4 py-3 h-full flex items-center gap-3">
          {/* Icon container - left side */}
          <div className={`w-8 h-8 ${nodeType.color} rounded-full flex items-center justify-center flex-shrink-0`}>
            {nodeType.icon}
          </div>
          
          {/* Node content - right side */}
          <div className="flex-1 min-w-0">
                      {/* Node name */}
          <h4 className="font-bold text-[#101330] text-sm truncate w-full mb-1">{node.name}</h4>
            
                         {/* Additional info for specific node types - based on n8n JSON */}
             {node.type.includes('n8n-nodes-base.webhook') && (
               <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                 POST
               </div>
             )}
             
             {node.type.includes('n8n-nodes-base.httpRequest') && (
               <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md truncate w-full">
                 {node.data?.method || 'GET'}: {node.data?.url ? node.data.url.split('/')[2] || 'API' : 'HTTP Request'}
               </div>
             )}
             
             {node.type.includes('n8n-nodes-base.function') && (
               <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                 Function
               </div>
             )}
             
             {node.type.includes('n8n-nodes-base.set') && (
               <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                 manual
               </div>
             )}
          </div>
        </div>
        
        {/* Input Connection Point (Left) */}
        <div 
          className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"
          data-node-id={node.id}
          data-connection-type="input"
          title="Input Connection"
        ></div>
        
        {/* Output Connection Point (Right) */}
        <div 
          className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"
          data-node-id={node.id}
          data-connection-type="output"
          title="Output Connection"
        ></div>
      </div>
    );
  }), []);

  return (
    <div className="h-full flex bg-gray-50">
      <div className="flex-1 relative overflow-hidden">
        {/* Header - n8n style */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FF4F79] rounded-lg flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#101330] mb-1">{workflow.name}</h2>
                <p className="text-sm text-[#6B7280]">{workflow.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Controles de Zoom - n8n style */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-white rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4 text-[#6B7280]" />
                </button>
                <span className="px-3 text-sm font-medium text-[#101330] min-w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-white rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4 text-[#6B7280]" />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button
                  onClick={handleResetView}
                  className="p-2 hover:bg-white rounded transition-colors"
                  title="Reset View"
                >
                  <RotateCcw className="h-4 w-4 text-[#6B7280]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas - n8n style */}
        <div className="pt-24 h-full">
          <div 
            ref={canvasRef}
            className={`relative w-full h-full bg-white overflow-hidden ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onClick={handleCanvasClick}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            {/* Grid Pattern - n8n style light theme */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                backgroundImage: `
                  linear-gradient(rgba(107, 114, 128, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(107, 114, 128, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            ></div>
            
            {/* Edges SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              {renderEdges}
            </svg>
            
            {/* Nodes */}
            <div 
              style={canvasTransform}
              className="relative"
            >
              {workflow.nodes.map((node) => {
                const nodeType = getNodeType(node.type);
                const x = node.position.x;
                const y = node.position.y;
                const isDragging = false;
                
                return (
                  <NodeComponent
                    key={node.id}
                    node={node}
                    nodeType={nodeType}
                    isDragging={isDragging}
                    isSelected={selectedNode?.id === node.id}
                    onNodeClick={handleNodeClick}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Instructions - n8n style based on JSON */}
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-gray-200">
          <div className="text-sm text-[#6B7280] space-y-3">
            <div className="font-semibold text-[#101330] mb-3 text-base">n8n Workflow Viewer</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>n8n-nodes-base.webhook - Entrada de dados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span>n8n-nodes-base.function - Processamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span>n8n-nodes-base.httpRequest - APIs externas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span>n8n-nodes-base.set - Retorno de dados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});