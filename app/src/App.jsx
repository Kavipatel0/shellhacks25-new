import { useState } from "react";
import "./App.css";
import FlowGraph from "./components/FlowGraph";
import FileSummaryModal from "./components/FileSummaryModal";
import { getTree } from "./api/getTree";
import { summarizeFile, getFileType } from "./api/summarizeFile";

function App() {
  const [count, setCount] = useState(0);
  const [url, setUrl] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState("");
  
  // File summary modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileSummary, setFileSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

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

  const handleFileClick = async (nodeData) => {
    // Only handle file clicks, not folders
    if (nodeData.nodeType === 'file') {
      setIsModalOpen(true);
      setIsLoadingSummary(true);
      setFileSummary(null);

      try {
        // Extract repository info from the current URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const owner = pathParts[0];
        const repo = pathParts[1];
        
        // Get the branch (default to 'main' if not specified)
        let branch = 'main';
        if (pathParts[2] === 'tree' && pathParts[3]) {
          branch = pathParts[3];
        }

        // The nodeData.id contains the full file path from the repository root
        // Format: owner/repo/branch/filepath
        console.log('Full node data:', nodeData);
        console.log('Node ID:', nodeData.id);
        console.log('Node Label:', nodeData.label);
        
        // Use the node ID which contains the full path
        const fullFilePath = nodeData.id;
        const filePath = `${owner}/${repo}/${branch}/${fullFilePath}`;
        const fileName = nodeData.label;
        const fileType = getFileType(fileName);

        console.log('Constructed file path:', filePath);

        const summary = await summarizeFile(filePath, fileName, fileType);
        setFileSummary(summary);
      } catch (err) {
        console.error("Error summarizing file:", err);
        setError(`Failed to summarize file: ${err.message}`);
      } finally {
        setIsLoadingSummary(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFileSummary(null);
    setIsLoadingSummary(false);
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
      <FlowGraph 
        initialNodes={nodes} 
        initialEdges={edges} 
        onNodeClick={handleFileClick}
      />
      
      <FileSummaryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fileSummary={fileSummary}
        isLoading={isLoadingSummary}
      />
    </>
  );
}

export default App;
