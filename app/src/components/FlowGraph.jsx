import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';

// Custom node component that applies different styles based on nodeType
const CustomNode = ({ data, isConnectable }) => {
  const isFolder = data.nodeType === 'folder';
  const nodeClass = isFolder ? 'folder-node' : 'file-node';
  
  return (
    <div className={`react-flow__node ${nodeClass}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
      />
      {isFolder && <div className="folder-icon"></div>}
      <div className="react-flow__node-label">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function FlowGraph({ initialNodes, initialEdges }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

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

  return (
    <div
      style={{
        width: "100vw",
        height: "80vh", // Increased height for vertical tree layout
        border: "2px solid #e2e8f0",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background 
          color="#374151" 
          gap={20} 
          size={1}
          variant="dots"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
