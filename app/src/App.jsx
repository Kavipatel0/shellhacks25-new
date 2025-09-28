import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import FlowGraph from "./components/FlowGraph";
import FileSummaryModal from "./components/FileSummaryModal";
import InfoCardsSection from "./components/InfoCardsSection";
import CommitViewer from "./components/CommitViewer";
import CodebaseAssistant from "./components/CodebaseAssistant";
import { getTree } from "./api/getTree";
import { summarizeFile, getFileType } from "./api/summarizeFile";
import { BackgroundBeams } from "./components/ui/shadcn-io/background-beams";






function HomePage() {
  const [count, setCount] = useState(0);
  const [url, setUrl] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState("");
  
  // File summary modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileSummary, setFileSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [previousRepos, setPreviousRepos] = useState([]);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState([]);

  // Load previous repositories from localStorage on component mount
  useEffect(() => {
    const savedRepos = localStorage.getItem('previousRepositories');
    if (savedRepos) {
      const parsedRepos = JSON.parse(savedRepos);
      console.log('=== Loading previous repositories ===');
      console.log('Saved repos:', parsedRepos);
      setPreviousRepos(parsedRepos);
    }
  }, []);

  // Update visible nodes and edges when expandedFolders changes
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('expandedFolders changed:', Array.from(expandedFolders));
    console.log('allNodes length:', allNodes.length);
    console.log('allEdges length:', allEdges.length);
    
    if (allNodes.length > 0) {
      const { visibleNodes, visibleEdges } = getVisibleNodesAndEdges(allNodes, allEdges, expandedFolders);
      console.log('Visible nodes count:', visibleNodes.length);
      console.log('Visible edges count:', visibleEdges.length);
      console.log('Setting nodes and edges...');
      setNodes(visibleNodes);
      setEdges(visibleEdges);
    }
    console.log('=== useEffect end ===');
  }, [expandedFolders, allNodes, allEdges]);

  // Function to save repository to localStorage
  const saveRepository = (repoUrl) => {
    const repoName = extractRepoName(repoUrl);
    if (!repoName) return;

    const newRepo = {
      url: repoUrl,
      name: repoName,
      timestamp: new Date().toISOString()
    };

    setPreviousRepos(prevRepos => {
      // Remove if already exists
      const filteredRepos = prevRepos.filter(repo => repo.url !== repoUrl);
      // Add to beginning and keep only last 3
      const updatedRepos = [newRepo, ...filteredRepos].slice(0, 3);
      localStorage.setItem('previousRepositories', JSON.stringify(updatedRepos));
      return updatedRepos;
    });
  };

  // Function to extract repository name from URL
  const extractRepoName = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]}`;
      }
    } catch (e) {
      // If URL parsing fails, try to extract from string
      const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  // Function to handle repository selection from previous repos
  const handleRepoSelect = (repoUrl) => {
    console.log('=== handleRepoSelect called ===');
    console.log('Selected repo URL:', repoUrl);
    setUrl(repoUrl);
    
    // Call handleSubmit directly with the URL
    handleSubmit({ preventDefault: () => {} }, repoUrl);
  };

  // Function to filter nodes based on expanded folders
  const getVisibleNodesAndEdges = (allNodes, allEdges, expandedFolders) => {
    console.log('=== getVisibleNodesAndEdges called ===');
    console.log('expandedFolders in function:', Array.from(expandedFolders));
    console.log('allNodes count:', allNodes.length);
    
    const visibleNodeIds = new Set();
    const visibleNodes = [];
    const visibleEdges = [];

    allNodes.forEach(node => {
      const isFolder = node.data.nodeType === 'folder';
      const parts = node.id.split('/');
      const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      
      if (isFolder) {
        // Always show all folders
        console.log('Adding folder to visible:', node.id);
        visibleNodeIds.add(node.id);
        visibleNodes.push(node);
      } else {
        // For files, only show if their immediate parent folder is expanded
        if (parentPath && expandedFolders.has(parentPath)) {
          console.log('Adding file to visible (parent expanded):', node.id, 'parent:', parentPath);
          visibleNodeIds.add(node.id);
          visibleNodes.push(node);
        } else {
          console.log('Hiding file (parent not expanded):', node.id, 'parent:', parentPath);
        }
      }
    });

    // Filter edges to only include those between visible nodes
    allEdges.forEach(edge => {
      if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
        visibleEdges.push(edge);
      }
    });

    // Apply dynamic positioning to visible nodes
    const positionedNodes = calculateNodePositions(visibleNodes, visibleEdges);
    
    console.log('Final visible nodes count:', positionedNodes.length);
    console.log('Final visible edges count:', visibleEdges.length);
    console.log('=== getVisibleNodesAndEdges end ===');
    return { visibleNodes: positionedNodes, visibleEdges };
  };

  const handleSubmit = async (e, urlToUse = null) => {
    e.preventDefault();
    const targetUrl = urlToUse || url;
    console.log('=== handleSubmit called ===');
    console.log('Using URL:', targetUrl);
    
    setError(""); // Clear previous errors
    setExpandedFolders(new Set()); // Reset expanded folders
    setHighlightedPath([]); // Clear highlighted path
    try {
      const { initialNodes: newNodes, initialEdges: newEdges } = await getTree(targetUrl);
      setAllNodes(newNodes);
      setAllEdges(newEdges);
      
      // Save repository to localStorage
      saveRepository(targetUrl);
      
      // Initially show all folders but no files
      const { visibleNodes, visibleEdges } = getVisibleNodesAndEdges(newNodes, newEdges, new Set());
      setNodes(visibleNodes);
      setEdges(visibleEdges);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching repository:", err);
    }
  };

  // Function to find path from root to a specific file
  const findPathToFile = (targetFileId, nodes, edges) => {
    const path = [];
    let currentId = targetFileId;
    
    // Build path backwards from target file to root
    while (currentId) {
      path.unshift(currentId);
      
      // Find the parent of current node
      const parentEdge = edges.find(edge => edge.target === currentId);
      if (parentEdge) {
        currentId = parentEdge.source;
      } else {
        break; // Reached root or no parent found
      }
    }
    
    return path;
  };

  // Function to toggle folder expansion
  const toggleFolder = (folderPath) => {
    console.log('=== toggleFolder called ===');
    console.log('Toggling folder:', folderPath);
    console.log('Current expanded folders:', Array.from(expandedFolders));
    
    setExpandedFolders(prevExpanded => {
      console.log('setExpandedFolders callback - prevExpanded:', Array.from(prevExpanded));
      const newExpandedFolders = new Set(prevExpanded);
      if (newExpandedFolders.has(folderPath)) {
        newExpandedFolders.delete(folderPath);
        console.log('Removing folder from expanded:', folderPath);
      } else {
        newExpandedFolders.add(folderPath);
        console.log('Adding folder to expanded:', folderPath);
      }
      console.log('New expanded folders:', Array.from(newExpandedFolders));
      console.log('=== toggleFolder end ===');
      return newExpandedFolders;
    });
  };

  const handleFileClick = async (nodeData, nodeId) => {
    // Only handle file clicks, not folders
    if (nodeData.nodeType === 'file') {
      console.log('📱 Opening modal...');
      
      // Find and highlight the path to this file
      const pathToFile = findPathToFile(nodeId, allNodes, allEdges);
      console.log('🗺️ Path to file:', pathToFile);
      setHighlightedPath(pathToFile);
      
      setIsModalOpen(true);
      setIsLoadingSummary(true);
      setFileSummary(null);
      
      // Set the selected file path for highlighting
      setSelectedFilePath(nodeId);

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

        // The nodeId contains the full file path from the repository root
        console.log('Full node data:', nodeData);
        console.log('Node ID:', nodeId);
        console.log('Node Label:', nodeData.label);
        
        // Use the nodeId which contains the full path
        const fullFilePath = nodeId;
        const filePath = `${owner}/${repo}/${branch}/${fullFilePath}`;
        const fileName = nodeData.label;
        const fileType = getFileType(fileName);

        console.log('Constructed file path:', filePath);
        console.log('Calling summarizeFile API...');

        const summary = await summarizeFile(filePath, fileName, fileType);
        console.log('✅ Summary received successfully:', summary);
        console.log('Summary type:', typeof summary);
        console.log('Summary keys:', Object.keys(summary || {}));
        console.log('📱 Setting file summary and closing loading...');
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
    // Keep the selectedFilePath for highlighting - don't clear it
    setHighlightedPath([]); // Clear the highlighted path
  };

  // Function to get the path from root to selected file
  const getPathToFile = (filePath) => {
    if (!filePath) return [];
    
    const pathParts = filePath.split('/');
    const path = [];
    
    // Build the path from root to file
    for (let i = 0; i < pathParts.length; i++) {
      const currentPath = pathParts.slice(0, i + 1).join('/');
      path.push(currentPath);
    }
    
    return path;
  };

  // Function to check if a node should be highlighted
  const isNodeHighlighted = (nodeId) => {
    if (!selectedFilePath) return false;
    const pathToFile = getPathToFile(selectedFilePath);
    return pathToFile.includes(nodeId);
  };

  // Function to check if an edge should be highlighted
  const isEdgeHighlighted = (edge) => {
    if (!selectedFilePath) return false;
    const pathToFile = getPathToFile(selectedFilePath);
    return pathToFile.includes(edge.source) && pathToFile.includes(edge.target);
  };

  // Function to calculate dynamic Y positions for better organization
  const calculateNodePositions = (nodes, edges) => {
    if (nodes.length === 0) return nodes;
    
    const nodeMap = new Map();
    const childrenMap = new Map();
    const parentMap = new Map();
    
    // Initialize maps
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      childrenMap.set(node.id, []);
    });
    
    // Build relationships from edges
    edges.forEach(edge => {
      childrenMap.get(edge.source)?.push(edge.target);
      parentMap.set(edge.target, edge.source);
    });
    
    // Find root nodes (nodes with no parents)
    const rootNodes = nodes.filter(node => !parentMap.has(node.id));
    
    if (rootNodes.length === 0) {
      // Fallback: treat all nodes as roots if no clear hierarchy
      return nodes.map((node, index) => ({
        ...node,
        position: {
          x: 100 + (index * 250),
          y: 200
        }
      }));
    }
    
    // Build tree structure and assign levels
    const levelMap = new Map();
    const visited = new Set();
    
    const assignLevel = (nodeId, level = 0) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      levelMap.set(nodeId, level);
      const children = childrenMap.get(nodeId) || [];
      
      children.forEach(childId => {
        assignLevel(childId, level + 1);
      });
    };
    
    // Assign levels starting from root nodes
    rootNodes.forEach(root => assignLevel(root.id, 0));
    
    // Group nodes by level
    const levelGroups = new Map();
    nodes.forEach(node => {
      const level = levelMap.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level).push(node);
    });
    
    // Sort levels
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    // Calculate positions
    const updatedNodes = nodes.map(node => {
      const level = levelMap.get(node.id) || 0;
      const levelIndex = sortedLevels.indexOf(level);
      const nodesInLevel = levelGroups.get(level) || [];
      const nodeIndex = nodesInLevel.findIndex(n => n.id === node.id);
      
      // Horizontal spacing between levels
      const xSpacing = 350;
      const xPosition = levelIndex * xSpacing + 100;
      
      // Vertical spacing within level
      const ySpacing = 150;
      const totalLevelHeight = (nodesInLevel.length - 1) * ySpacing;
      const startY = 200;
      const yPosition = startY + (nodeIndex * ySpacing) - (totalLevelHeight / 2);
      
      return {
        ...node,
        position: {
          x: xPosition,
          y: yPosition
        }
      };
    });
    
    return updatedNodes;
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Background Beams */}
      <BackgroundBeams className="fixed inset-0 z-0" />
      
      {/* Main Content */}
      <main className="main-content relative z-10">
        
        <div className="hero-section">

          
          <h1 className="hero-project-name">GitFlow</h1>
          
          <h2 className="hero-main-title">
            Where code meets
            <span className="hero-highlight"> clarity</span>
          </h2>
          
          <p className="hero-description">
            Transform any GitHub repository into an interactive, visual tree structure.
            
            AI-powered intelligent insights, smart summaries, and code analysis to help you understand a codebase with confidence.
          </p>
          
          <div className="hero-actions">
            <Link 
              to="/commits" 
              className="commit-viewer-link"
            >
              📝 View Commit History
            </Link>
          </div>
        </div>

        {/* Input Section */}
        <div className="input-section">
          <form onSubmit={handleSubmit} className="url-form">
            <div className="input-container">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter GitHub repository URL..."
                className="url-input"
              />
              <button type="submit" className="submit-button">
                <span className="button-icon">🚀</span>
                Generate Tree
              </button>
            </div>
          </form>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Info Cards Section */}
        {nodes.length > 0 && (
          <InfoCardsSection 
            nodes={allNodes} 
            edges={allEdges} 
            repoUrl={url} 
          />
        )}

        {/* Graph Section */}
        {nodes.length > 0 && (
          <div className="graph-section">
            {/* Legend */}
            <div className="graph-legend">
              <div className="legend-item">
                <div className="legend-color folder-legend"></div>
                <span className="legend-text">Folder</span>
              </div>
              <div className="legend-item">
                <div className="legend-color file-legend"></div>
                <span className="legend-text">File</span>
              </div>
            </div>
            
            <FlowGraph 
              initialNodes={nodes} 
              initialEdges={edges} 
              onToggleFolder={toggleFolder}
              expandedFolders={expandedFolders}
              onFileClick={handleFileClick}
              selectedFilePath={selectedFilePath}
              isNodeHighlighted={isNodeHighlighted}
              isEdgeHighlighted={isEdgeHighlighted}
              highlightedPath={highlightedPath}
            />
          </div>
        )}

        {/* Codebase Assistant Section */}
        {nodes.length > 0 && (
          <CodebaseAssistant 
            repoUrl={url} 
            nodes={nodes} 
            edges={edges} 
          />
        )}

        {/* Previous Repositories Section */}
        {previousRepos.length > 0 && (
          <div className="previous-repos-section">
            <h3 className="previous-repos-title">Previous Repositories</h3>
            <div className="previous-repos-list">
              {previousRepos.map((repo, index) => (
                <div 
                  key={index} 
                  className="repo-card"
                  onClick={() => handleRepoSelect(repo.url)}
                >
                  <div className="repo-icon">📁</div>
                  <div className="repo-info">
                    <div className="repo-name">{repo.name}</div>
                    <div className="repo-url">{repo.url}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* File Summary Modal */}
      <FileSummaryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fileSummary={fileSummary}
        isLoading={isLoadingSummary}
      />

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">Project By: Kavi Patel, Stanley Ke, Arnav Bagmar, Hieu Nguyen</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/commits" element={<CommitViewer />} />
    </Routes>
  );
}

export default App;
