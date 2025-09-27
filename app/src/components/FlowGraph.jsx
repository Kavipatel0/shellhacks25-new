import React, { useCallback } from "react";
import ReactFlow, { MiniMap, Controls, Background } from "reactflow";
import "reactflow/dist/style.css";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Input Node" },
    position: { x: 250, y: 5 },
  },
  {
    id: "2",
    data: { label: "Default Node" },
    position: { x: 100, y: 100 },
  },
  {
    id: "3",
    data: { label: "Output Node" },
    position: { x: 250, y: 200 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

export default function FlowGraph() {
  const onNodesChange = useCallback(() => {}, []);
  const onEdgesChange = useCallback(() => {}, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "60vh",
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
