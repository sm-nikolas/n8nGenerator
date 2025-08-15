import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { Workflow, WorkflowNode } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, GitBranch } from 'lucide-react';
// import { NodeEditor } from './NodeEditor'; // Removed in read-only mode
// import Draggable from 'react-draggable'; // Removed in read-only mode

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
    'trigger': {
      name: 'Manual Trigger',
      color: 'bg-green-500',
      icon: '🚀',
      shape: 'd-shaped', // D-shaped like n8n
      isTrigger: true
    },
    'webhook': {
      name: 'Webhook',
      color: 'bg-blue-500',
      icon: '📡',
      shape: 'd-shaped', // D-shaped like n8n
      isTrigger: true
    },
    'action': {
      name: 'HTTP Request',
      color: 'bg-purple-500',
      icon: '🌐',
      shape: 'square',
      isTrigger: false
    },
    'search': {
      name: 'Search',
      color: 'bg-indigo-500',
      icon: '🔍',
      shape: 'square',
      isTrigger: false
    },
    'format': {
      name: 'Format Data',
      color: 'bg-orange-500',
      icon: '</>',
      shape: 'square',
      isTrigger: false
    },
    'build': {
      name: 'Build Request',
      color: 'bg-yellow-500',
      icon: '⚙️',
      shape: 'square',
      isTrigger: false
    },
    'api': {
      name: 'API Call',
      color: 'bg-purple-600',
      icon: '🔌',
      shape: 'square',
      isTrigger: false
    },
    'gmail': {
      name: 'Gmail',
      color: 'bg-red-500',
      icon: '📧',
      shape: 'square',
      isTrigger: false
    },
    'slack': {
      name: 'Slack',
      color: 'bg-indigo-600',
      icon: '💬',
      shape: 'square',
      isTrigger: false
    },
  }), []);

  const getNodeType = useCallback((type: string) => {
    return nodeTypes[type as keyof typeof nodeTypes] || {
      name: type.split('.').pop() || 'Unknown',
      color: 'bg-gray-500',
      icon: '🔧',
    };
  }, [nodeTypes]);

  const handleNodeClick = useCallback((node: WorkflowNode) => {
    // In read-only mode, just show basic info or do nothing
    
    // setSelectedNode(node); // Disabled in read-only mode
  }, []);

  // Remove all connection and editing functions
  // const handleConnectionStart = useCallback(...);
  // const handleConnectionMove = useCallback(...);
  // const handleConnectionEnd = useCallback(...);
  // const handleCanvasClick = useCallback(...);
  // const handleEdgeClick = useCallback(...);
  // const checkForCycles = useCallback(...);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only allow clicking on nodes, not creating connections
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
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      // Use requestAnimationFrame for smooth panning
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
      
      // Use requestAnimationFrame for smooth zooming
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

  // Remove unused functions
  // const handleNodeUpdate = useCallback(...);
  // const handleCloseNodeEditor = useCallback(...);

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
        
        // Cleanup timeout to prevent memory leaks
        // if (updateTimeoutRef.current) { // This line was removed as per the edit hint
        //   clearTimeout(updateTimeoutRef.current);
        // }
      };
    }
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  // Enhanced edge rendering with original light theme
  const renderEdges = useMemo(() => {
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
              
              {/* Edge label - Show method for webhook connections */}
              {sourceNode.type.includes('webhook') && (
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-600 pointer-events-none"
                  style={{ fontSize: '10px' }}
                >
                  {sourceNode.parameters?.method || 'POST'}
                </text>
              )}
              
              {/* Default edge label */}
              {!sourceNode.type.includes('webhook') && (
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-600 pointer-events-none"
                  style={{ fontSize: '10px' }}
                >
                  main
                </text>
              )}
            </g>
          );
        });
      });
    });
    
    return edges;
  }, [workflow.connections, workflow.nodes, getNodeType, createCurvedPath]);

  // Enhanced curved path creation
  const createCurvedPath = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const controlPointOffset = Math.min(distance * 0.3, 100);
    
    // Calculate control points for smooth curve
    const cp1x = x1 + controlPointOffset;
    const cp1y = y1;
    const cp2x = x2 - controlPointOffset;
    const cp2y = y2;
    
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }, []);

  // Memoized individual node component for original light theme
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
    const isTrigger = nodeType.isTrigger;
    const nodeWidth = isTrigger ? 160 : 140; // Keep optimized sizes
    const nodeHeight = 70; // Keep optimized height
    
    return (
      <div
        key={node.id}
        className={`absolute bg-white border-2 border-gray-200 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 ${
          isSelected ? 'border-[#FF4F79] shadow-lg ring-2 ring-[#FF4F79]/20' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: nodeWidth,
          height: nodeHeight,
          transition: 'all 0.2s ease-out',
          // Keep D-shaped styling for triggers
          borderRadius: isTrigger ? '0 12px 12px 0' : '12px',
          // Remove left border for D-shaped nodes
          ...(isTrigger && {
            borderLeft: 'none',
            borderTopLeftRadius: '0',
            borderBottomLeftRadius: '0'
          })
        }}
        onClick={() => onNodeClick(node)}
      >
        {/* Trigger Lightning Icon for trigger nodes */}
        {isTrigger && (
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-3 h-3 text-white font-bold text-xs">⚡</div>
          </div>
        )}
        
        {/* Node Header - colored background with centered content */}
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
  }), []);

  return (
    <div className="h-full flex bg-gray-50">
      <div className="flex-1 relative overflow-hidden">
        {/* Header - padronizado com PreviewPanel */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-3 z-20 shadow-sm">
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
              {/* Controles de Zoom */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-gray-50 rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4 text-[#6B7280]" />
                </button>
                <span className="px-2 text-sm font-medium text-[#101330] min-w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-gray-50 rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4 text-[#6B7280]" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                  onClick={handleResetView}
                  className="p-1.5 hover:bg-gray-50 rounded transition-colors"
                  title="Reset View"
                >
                  <RotateCcw className="h-4 w-4 text-[#6B7280]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="pt-20 h-full">
          <div 
            ref={canvasRef}
            className={`relative w-full h-full bg-white overflow-hidden ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onClick={handleCanvasClick}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            {/* Grid Pattern - original light theme */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                backgroundImage: `
                  linear-gradient(rgba(107, 114, 128, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(107, 114, 128, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '25px 25px'
              }}
            ></div>
            
            {/* Edges SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
              // Removed handleConnectionMove
            >
              {renderEdges}
              
              {/* Connection Preview */}
              {/* Removed connection preview */}
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
                const isDragging = false; // No dragging in this version
                
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

        {/* Instructions - original light theme */}
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
          <div className="text-xs text-[#6B7280] space-y-2">
            <div className="font-medium text-[#101330] mb-2">n8n Workflow Viewer</div>
            <div>• Nodes D-shaped são triggers (início do workflow)</div>
            <div>• Nodes quadrados são actions (processamento)</div>
            <div>• Use zoom e pan para navegar</div>
            <div>• Conexões mostram o fluxo de dados</div>
            <div>• Clique nos nodes para ver detalhes</div>
          </div>
        </div>
      </div>

      {/* NodeEditor - Removed in read-only mode */}
      {/* {selectedNode && (
        <NodeEditor
          node={selectedNode}
          onClose={handleCloseNodeEditor}
          onUpdate={handleNodeUpdate}
        />
      )} */}
    </div>
  );
});