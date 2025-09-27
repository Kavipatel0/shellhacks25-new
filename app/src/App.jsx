import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import FlowGraph from "./components/FlowGraph";
import { getTree } from "./api/getTree";

function App() {
  const [count, setCount] = useState(0);
  const [url, setUrl] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      const { initialNodes: newNodes, initialEdges: newEdges } = await getTree(url);
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching repository:", err);
    }
  };

  return (
    <>
      <div>
      </div>    
      <h2>Flow Graph</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter GitHub repository URL"
          style={{ marginRight: "0.5rem", padding: "8px", width: "300px" }}
        />
        <button type="submit">Submit</button>
      </form>
      {error && (
        <div style={{ 
          color: "#ef4444", 
          backgroundColor: "#fef2f2", 
          border: "1px solid #fecaca", 
          borderRadius: "8px", 
          padding: "12px", 
          marginBottom: "1rem",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
      <FlowGraph initialNodes={nodes} initialEdges={edges} />
    </>
  );
}

export default App;
