import React, { useState } from "react";
import getTree from "../../api/getTree";
import getCommitHistory from "../../api/getCommitHistory";
import FlowGraph from "../FlowGraph";
export default function FlowPage() {
  const [url, setUrl] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState("");
  const [commits, setCommits] = useState([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [currentCommit, setCurrentCommit] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setCommits([]);
    setCurrentCommit(null);
    
    try {
      // Fetch tree data first
      const treeData = await getTree(url);
      const { initialNodes: newNodes, initialEdges: newEdges } = treeData;
      setNodes(newNodes);
      setEdges(newEdges);
      
      // Try to fetch commit history separately (don't fail the whole operation if this fails)
      try {
        console.log('About to fetch commit history for:', url);
        const commitHistory = await fetchCommitHistory(url);
        console.log('Commit history received:', commitHistory);
        setCommits(commitHistory);
      } catch (commitErr) {
        console.error("Failed to fetch commit history:", commitErr);
        setCommits([]);
        // Show a warning but don't block the main functionality
        if (!error) {
          setError(`Warning: Could not load commit history. ${commitErr.message}`);
        }
      }
    } catch (err) {
      setError(err.message || String(err));
      console.error("Error fetching repository:", err);
    }
  };

  const fetchCommitHistory = async (repoUrl) => {
    setIsLoadingCommits(true);
    try {
      const commitHistory = await getCommitHistory(repoUrl);
      return commitHistory;
    } catch (err) {
      console.error("Error fetching commit history:", err);
      throw err; // Re-throw to be handled by the caller
    } finally {
      setIsLoadingCommits(false);
    }
  };

  const handleCommitSelect = async (commit) => {
    setCurrentCommit(commit);
    setError("");
    
    try {
      const { initialNodes: newNodes, initialEdges: newEdges } = await getTree(
        url,
        commit.sha
      );
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      setError(err.message || String(err));
      console.error("Error fetching repository at commit:", err);
    }
  };

  // Test function for debugging
  const testCommitFetch = async () => {
    try {
      console.log('Testing commit fetch...');
      const result = await fetch('https://api.github.com/repos/facebook/react/commits?per_page=5');
      console.log('Test response status:', result.status);
      const data = await result.json();
      console.log('Test commits data:', data);
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  // Expose test function to window for console debugging
  React.useEffect(() => {
    window.testCommitFetch = testCommitFetch;
  }, []);

  return (
    <div className="p-6">
      <h2>Flow Graph</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter GitHub repository (e.g., facebook/react or https://github.com/facebook/react)"
          style={{ marginRight: "0.5rem", padding: "8px", width: "400px" }}
        />
        <button type="submit">Submit</button>
        <button 
          type="button" 
          onClick={() => setUrl("facebook/react")}
          style={{ marginLeft: "0.5rem", padding: "8px" }}
        >
          Test with React
        </button>
        <button 
          type="button" 
          onClick={testCommitFetch}
          style={{ marginLeft: "0.5rem", padding: "8px", backgroundColor: "#ff6b6b", color: "white" }}
        >
          Test Commit API
        </button>
      </form>
      {error && (
        <div
          style={{
            color: "#ef4444",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "1rem",
            fontSize: "14px",
          }}
        >
          {error}
          {error.includes("rate limit") && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
              💡 Tip: Create a GitHub token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">github.com/settings/tokens</a> and add it to a .env file as VITE_GITHUB_TOKEN=your_token_here
            </div>
          )}
        </div>
      )}
      <FlowGraph 
        initialNodes={nodes} 
        initialEdges={edges}
        commits={commits}
        onCommitSelect={handleCommitSelect}
        isLoadingCommits={isLoadingCommits}
        currentCommit={currentCommit}
      />
    </div>
  );
}
