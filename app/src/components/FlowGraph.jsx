import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  getBezierPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';

// Custom node component that applies different styles based on nodeType

const CustomNode = ({ data, id, isConnectable, onNodeClick, onToggleFolder, expandedFolders, isNodeHighlighted }) => {
  const isFolder = data.nodeType === 'folder';
  const nodeClass = isFolder ? 'folder-node' : 'file-node';
  const isExpanded = expandedFolders && expandedFolders.has(id);
  const highlighted = isNodeHighlighted ? isNodeHighlighted(id) : false;
  
  // Debug logging (can be removed later)
  if (id && isFolder) {
    console.log('CustomNode render:', {
      id: id,
      isFolder,
      isExpanded,
      expandedFolders: expandedFolders ? Array.from(expandedFolders) : 'null'
    });
  }
  
  const handleClick = () => {
    if (onNodeClick) {
      // Pass both the data and the node id
      onNodeClick({ ...data, id });
    }
  };
  
  return (
    <div 
      className={`react-flow__node ${nodeClass} ${isFolder ? 'clickable-folder' : ''} ${highlighted ? 'highlighted-node' : ''}`}
      onClick={handleClick}
      style={{ cursor: isFolder ? 'default' : 'pointer' }}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
      />
      {isFolder && (
        <div className="folder-icon-container">
          <div className="folder-icon"></div>
          <div className={`expand-indicator ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {isExpanded ? '−' : '+'}
          </div>
        </div>
      )}
      <div className="react-flow__node-label">{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
      />
    </div>
  );
};

// Custom edge component for styling
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, isEdgeHighlighted }) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edge = { id, source: data?.source, target: data?.target };
  const highlighted = isEdgeHighlighted ? isEdgeHighlighted(edge) : false;

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${highlighted ? 'highlighted-edge' : ''}`}
        d={edgePath}
        data-edge-type={data?.edgeType || 'default'}
      />
    </>
  );
};

export default function FlowGraph({ initialNodes, initialEdges, onToggleFolder, expandedFolders, onFileClick, selectedFilePath, isNodeHighlighted, isEdgeHighlighted }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

  const nodeTypes = useMemo(() => ({
    custom: (props) => <CustomNode {...props} onToggleFolder={onToggleFolder} expandedFolders={expandedFolders} isNodeHighlighted={isNodeHighlighted} />,
  }), [onToggleFolder, expandedFolders, isNodeHighlighted]);

  const edgeTypes = useMemo(() => ({
    default: (props) => <CustomEdge {...props} isEdgeHighlighted={isEdgeHighlighted} />,
  }), [isEdgeHighlighted]);

  useEffect(() => {
    if (initialNodes) {
      // Map all nodes to use the custom type
      const nodesWithCustomType = initialNodes.map(node => ({
        ...node,
        type: 'custom'
      }));
      setNodes(nodesWithCustomType);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges || []);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [],
  );

  const onNodeClick = useCallback((event, node) => {
    console.log('=== Node clicked via React Flow ===');
    console.log('Node ID:', node.id);
    console.log('Node data:', node.data);
    console.log('Is folder:', node.data.nodeType === 'folder');
    console.log('expandedFolders before click:', expandedFolders ? Array.from(expandedFolders) : 'null');
    if (node.data.nodeType === 'folder' && onToggleFolder) {
      console.log('Calling onToggleFolder for:', node.id);
      onToggleFolder(node.id);
    } else if (node.data.nodeType === 'file' && onFileClick) {
      console.log('Calling onFileClick for:', node.id);
      onFileClick(node.data, node.id);
    }
  }, [onToggleFolder, onFileClick, expandedFolders]);

  return (
    <div className="flow-graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
      >
        <Background 
          color="#404040" 
          gap={20} 
          size={1}
          variant="dots"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
