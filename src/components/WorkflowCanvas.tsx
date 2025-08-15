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
    'manualTrigger': {
      name: 'Manual Trigger',
      color: 'bg-red-600',
      icon: <Zap className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: true
    },
    'gmail': {
      name: 'Gmail',
      color: 'bg-red-500',
      icon: <FileText className="h-4 w-4 text-white" />,
      shape: 'pill',
      isTrigger: false
    }
  }), []);

  const getNodeType = useCallback((nodeType: string) => {
    // Extract the base type from n8n node type
    if (nodeType.includes('webhook')) return nodeTypes.webhook;
    if (nodeType.includes('function')) return nodeTypes.function;
    if (nodeType.includes('httpRequest')) return nodeTypes.httpRequest;
    if (nodeType.includes('search')) return nodeTypes.search;
    if (nodeType.includes('set')) return nodeTypes.set;
    if (nodeType.includes('manualTrigger')) return nodeTypes.manualTrigger;
    if (nodeType.includes('gmail')) return nodeTypes.gmail;
    if (nodeType.includes('trigger')) return nodeTypes.trigger;
    if (nodeType.includes('action')) return nodeTypes.action;
    if (nodeType.includes('format')) return nodeTypes.format;
    if (nodeType.includes('build')) return nodeTypes.build;
    if (nodeType.includes('api')) return nodeTypes.api;
    
    // Default to function type
    return nodeTypes.function;
  }, [nodeTypes]);

  const createCurvedPath = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const midX = (startX + endX) / 2;
    const controlPoint1X = startX + (midX - startX) * 0.5;
    const controlPoint1Y = startY;
    const controlPoint2X = midX + (endX - midX) * 0.5;
    const controlPoint2Y = endY;
    
    return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  }, []);

  const createRightAngledPath = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  }, []);

  const handleNodeClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  }, [selectedNode]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  }, []);

  // Generate edges from workflow connections
  const edges = useMemo(() => {
    const edges: JSX.Element[] = [];
    
    // Convert n8n connections format to edges for rendering
    Object.entries(workflow.connections).forEach(([sourceNodeName, connections]) => {
      const sourceNode = workflow.nodes.find(n => n.name === sourceNodeName);
      if (!sourceNode) return;
      
      connections.main.forEach((mainConnections, outputIndex) => {
        mainConnections.forEach((connection, connectionIndex) => {
          const targetNode = workflow.nodes.find(n => n.name === connection.node);
          if (!targetNode) return;
          
          const sourceNodeType = getNodeType(sourceNode.type);
          const targetNodeType = getNodeType(targetNode.type);
          
          // Calculate connection points based on node positions and types
          const sourcePos = nodePositionsRef.current.get(sourceNode.id) || sourceNode.position;
          const targetPos = nodePositionsRef.current.get(targetNode.id) || targetNode.position;
          
          // Source node output point (right side)
          const sourceWidth = sourceNodeType.isTrigger ? 160 : 140;
          const startX = sourcePos.x + sourceWidth;
          const startY = sourcePos.y + 35; // Node height / 2 (70/2)
          
          // Target node input point (left side) - Only for non-trigger nodes
          const endX = targetPos.x;
          const endY = targetPos.y + 35; // Node height / 2 (70/2)
          
          // Create smooth curved path like original
          const pathData = createCurvedPath(startX, startY, endX, endY);
          
          // Calculate arrow head
          const arrowSize = 8;
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowX = endX - arrowSize * Math.cos(angle);
          const arrowY = endY - arrowSize * Math.sin(angle);
          
          const arrowPath = `M ${arrowX} ${arrowY} L ${arrowX - arrowSize * Math.cos(angle - Math.PI/6)} ${arrowY - arrowSize * Math.sin(angle - Math.PI/6)} L ${arrowX - arrowSize * Math.cos(angle + Math.PI/6)} ${arrowY - arrowSize * Math.sin(angle + Math.PI/6)} Z`;
          
          const edgeKey = `${sourceNode.id}-${targetNode.id}-${outputIndex}-${connectionIndex}`;
          
          edges.push(
            <g key={edgeKey} className="edge-group">
              {/* Main connection line - original style */}
              <path
                d={pathData}
                stroke="#6B7280"
                strokeWidth="3"
                fill="none"
                className="drop-shadow-sm"
              />
              
              {/* Arrow head */}
              <path
                d={arrowPath}
                fill="#6B7280"
                className="drop-shadow-sm"
              />
            </g>
          );
        });
      });
    });
    
    return edges;
  }, [workflow.connections, workflow.nodes, getNodeType, createCurvedPath]);

  // Render nodes
  const renderedNodes = useMemo(() => workflow.nodes.map(node => {
    const nodeType = getNodeType(node.type);
    const isTrigger = nodeType.isTrigger;
    const isSelected = selectedNode?.id === node.id;
    
    return (
      <div
        key={node.id}
        className={`absolute bg-white border border-gray-200 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 ${
          isSelected ? 'border-[#FF4F79] shadow-2xl ring-2 ring-[#FF4F79]/20' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: 160,
          height: 80,
          transition: 'all 0.2s ease-out',
        }}
        onClick={() => handleNodeClick(node)}
      >
        {/* Node Header - colored background with icon */}
        <div 
          className={`px-3 py-2 ${nodeType.color} text-white rounded-t-lg flex flex-col items-center justify-center text-center ${
            isTrigger ? 'rounded-l-none' : ''
          }`}
          style={{ height: '35px' }}
        >
          {/* Icon centered at top */}
          <span className="text-lg">{nodeType.icon}</span>
        </div>
        
        {/* Node Body - light background with centered content */}
        <div className="px-3 py-2 cursor-pointer bg-gray-50 rounded-b-lg flex flex-col items-center justify-center text-center" style={{ height: '35px' }}>
          {/* Node name centered */}
          <h4 className="font-medium text-[#101330] text-sm truncate w-full">{node.name}</h4>
          
          {/* Additional info for specific node types */}
          {node.type.includes('webhook') && node.parameters?.method && (
            <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {node.parameters.method}
            </div>
          )}
          
          {node.type.includes('httpRequest') && node.parameters?.url && (
            <div className="mt-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate w-full">
              {node.parameters.method || 'GET'}: {node.parameters.url}
            </div>
          )}
        </div>
        
        {/* Input Connection Point (Left) - Only for non-trigger nodes */}
        {!isTrigger && (
          <div 
            className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"
            data-node-id={node.id}
            data-connection-type="input"
            title="Input Connection"
          ></div>
        )}
        
        {/* Output Connection Point (Right) */}
        <div 
          className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"
          data-node-id={node.id}
          data-connection-type="output"
          title="Output Connection"
        ></div>
      </div>
    );
  }), [workflow.nodes, getNodeType, selectedNode, handleNodeClick]);

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
                  <ZoomIn className="h-4 w-4 text-white" />
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

        {/* Canvas Area */}
        <div
          ref={canvasRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid Pattern - n8n style */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Render edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges}
          </svg>

          {/* Render nodes */}
          {renderedNodes}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg max-w-md">
          <h3 className="font-semibold text-[#101330] mb-2">Canvas Instructions</h3>
          <ul className="text-sm text-[#6B7280] space-y-1">
            <li>• <strong>Drag</strong> to pan around the canvas</li>
            <li>• <strong>Scroll</strong> to zoom in/out</li>
            <li>• <strong>Click</strong> nodes to select them</li>
            <li>• <strong>Right-click</strong> for context menu</li>
          </ul>
          <div className="mt-3 text-xs text-[#9CA3AF]">
            <p><strong>Node Types:</strong></p>
            <p>• <span className="text-blue-600">Webhook</span> - API endpoints</p>
            <p>• <span className="text-purple-600">Function</span> - Custom logic</p>
            <p>• <span className="text-green-600">HTTP Request</span> - API calls</p>
            <p>• <span className="text-orange-600">Set</span> - Data manipulation</p>
          </div>
        </div>
      </div>
    </div>
  );
});