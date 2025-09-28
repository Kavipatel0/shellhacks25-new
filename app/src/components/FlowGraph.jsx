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
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import CommitHistoryDropdown from './CommitHistoryDropdown';

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

// Component to handle auto-fit view
function AutoFitView({ nodes }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    // Auto-fit view when component mounts or when nodes change
    if (nodes && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, duration: 800 });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [fitView, nodes]);

  return null;
}

export default function FlowGraph({ 
  initialNodes, 
  initialEdges, 
  onToggleFolder, 
  expandedFolders, 
  onFileClick, 
  selectedFilePath, 
  isNodeHighlighted, 
  isEdgeHighlighted, 
  highlightedPath = [],
  commits = [],
  onCommitSelect,
  isLoadingCommits = false,
  currentCommit = null
}) {
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
      // Map all nodes to use the custom type and add highlighting
      const nodesWithCustomType = initialNodes.map(node => ({
        ...node,
        type: 'custom',
        className: highlightedPath.includes(node.id) ? 'highlighted-node' : ''
      }));
      setNodes(nodesWithCustomType);
    }
  }, [initialNodes, setNodes, highlightedPath]);

  useEffect(() => {
    if (initialEdges) {
      // Add highlighting to edges in the path
      const edgesWithHighlighting = initialEdges.map(edge => {
        const isInPath = highlightedPath.some((nodeId, index) => {
          if (index === 0) return false; // Skip root node
          const prevNodeId = highlightedPath[index - 1];
          return edge.source === prevNodeId && edge.target === nodeId;
        });
        
        return {
          ...edge,
          className: isInPath ? 'highlighted-path' : '',
          style: isInPath ? { stroke: '#3b82f6', strokeWidth: 3 } : {}
        };
      });
      setEdges(edgesWithHighlighting);
    }
  }, [initialEdges, setEdges, highlightedPath]);

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
      {/* Commit History Dropdown positioned at top right - outside ReactFlow */}
      <div className="commit-history-overlay">
        <CommitHistoryDropdown
          commits={commits}
          onCommitSelect={onCommitSelect}
          isLoading={isLoadingCommits}
          currentCommit={currentCommit}
        />
      </div>
      
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
        preventScrolling={false}
        deleteKeyCode={null}
      >
        <AutoFitView nodes={nodes} />
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
