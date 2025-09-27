import React from 'react';

async function fetchJSON(url) {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const headers = token ? { 'Authorization': `token ${token}` } : {};
  
  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(`GitHub API rate limit exceeded. Please try again later or use a GitHub token for higher limits.`);
    } else if (response.status === 404) {
      throw new Error(`Repository not found. Please check the URL.`);
    } else {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
  }
  return await response.json();
}

function parseGitHubUrl(input) {
  try {
    const u = new URL(input.trim());
    const parts = u.pathname.replace(/^\/+/, "").split("/");
    const [owner, repo, maybeTree, ref, ...rest] = parts;
    const subpath = maybeTree === "tree" && rest.length ? rest.join("/") : "";
    return { owner, repo, ref: maybeTree === "tree" ? ref : undefined, subpath };
  } catch {
    throw new Error("Invalid GitHub repository URL");
  }
}

async function getDefaultBranch(owner, repo) {
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const repoInfo = await fetchJSON(repoApiUrl);
  return repoInfo.default_branch;
}

function trimTreeEntries(tree) {
  // Remove entries with path '.' or empty path
  return tree.filter(item => item.path && item.path !== '.');
}

function buildNodesAndEdges(tree) {
  // Intelligent hierarchical layout for nodes - top to bottom tree structure
  // Each node: id = full path, label with icon (📁 for tree, 📄 for blob)
  // Edges connect parent folder to child
  const nodes = [];
  const edges = [];
  const xGap = 180, yGap = 80; // Reduced spacing but safe from overlaps

  // Build a map from path to item, and parent→children map
  const pathToItem = {};
  const parentToChildren = {};
  const nodeIds = new Set();
  tree.forEach(item => {
    pathToItem[item.path] = item;
    nodeIds.add(item.path);
    // Build parent→children map
    const parts = item.path.split('/');
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
    if (!parentToChildren[parent]) parentToChildren[parent] = [];
    parentToChildren[parent].push(item.path);
  });

  // Sort children: folders first, then files, then alphabetical
  function sortChildren(paths) {
    return paths.slice().sort((a, b) => {
      const aIsFolder = pathToItem[a].type === 'tree';
      const bIsFolder = pathToItem[b].type === 'tree';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      // Both folders or both files: alphabetical by last segment
      const aName = a.split('/').slice(-1)[0].toLowerCase();
      const bName = b.split('/').slice(-1)[0].toLowerCase();
      return aName.localeCompare(bName);
    });
  }

  // Traverse and assign positions - left to right tree structure
  let row = 0;
  const positions = {};
  function dfs(path, depth) {
    const children = parentToChildren[path] ? sortChildren(parentToChildren[path]) : [];
    if (children.length === 0) {
      // Leaf node (file or empty folder)
      const y = row * yGap;
      const x = depth * xGap;
      positions[path] = { x, y };
      row += 1;
      return { minY: y, maxY: y };
    } else {
      // Folder with children
      let minY = null, maxY = null;
      children.forEach(child => {
        const { minY: cMin, maxY: cMax } = dfs(child, depth + 1);
        if (minY === null || cMin < minY) minY = cMin;
        if (maxY === null || cMax > maxY) maxY = cMax;
      });
      // Center parent between its children vertically
      const y = Math.round((minY + maxY) / 2);
      const x = depth * xGap;
      if (path !== null) positions[path] = { x, y };
      return { minY, maxY };
    }
  }
  // Roots are parentToChildren[null]
  const roots = parentToChildren[null] ? sortChildren(parentToChildren[null]) : [];
  roots.forEach(root => {
    dfs(root, 0);
  });

  // Create nodes with computed positions
  Object.keys(positions).forEach(id => {
    const item = pathToItem[id];
    const isFolder = item.type === 'tree';
    const label = id.split('/').slice(-1)[0];
    nodes.push({
      id,
      data: { 
        label,
        nodeType: isFolder ? 'folder' : 'file'
      },
      position: positions[id],
      type: 'default',
    });
  });

  // Build edges by connecting each item to its parent folder, if any
  tree.forEach(item => {
    const id = item.path;
    const parts = id.split('/');
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      if (nodeIds.has(parentPath)) {
        edges.push({
          id: `${parentPath}-${id}`,
          source: parentPath,
          target: id,
          type: 'default',
        });
      }
    }
  });

  return { initialNodes: nodes, initialEdges: edges };
}

// Sample data for testing when API fails
function getSampleTreeData() {
  return [
    { path: 'src', type: 'tree' },
    { path: 'src/components', type: 'tree' },
    { path: 'src/components/App.jsx', type: 'blob' },
    { path: 'src/components/Header.jsx', type: 'blob' },
    { path: 'src/components/Footer.jsx', type: 'blob' },
    { path: 'src/components/Navbar.jsx', type: 'blob' },
    { path: 'src/components/Button.jsx', type: 'blob' },
    { path: 'src/components/Modal.jsx', type: 'blob' },
    { path: 'src/utils', type: 'tree' },
    { path: 'src/utils/helpers.js', type: 'blob' },
    { path: 'src/utils/constants.js', type: 'blob' },
    { path: 'src/utils/validation.js', type: 'blob' },
    { path: 'src/hooks', type: 'tree' },
    { path: 'src/hooks/useAuth.js', type: 'blob' },
    { path: 'src/hooks/useLocalStorage.js', type: 'blob' },
    { path: 'src/styles', type: 'tree' },
    { path: 'src/styles/globals.css', type: 'blob' },
    { path: 'src/styles/components.css', type: 'blob' },
    { path: 'public', type: 'tree' },
    { path: 'public/index.html', type: 'blob' },
    { path: 'public/favicon.ico', type: 'blob' },
    { path: 'public/manifest.json', type: 'blob' },
    { path: 'docs', type: 'tree' },
    { path: 'docs/README.md', type: 'blob' },
    { path: 'docs/API.md', type: 'blob' },
    { path: 'package.json', type: 'blob' },
    { path: 'README.md', type: 'blob' },
    { path: 'tsconfig.json', type: 'blob' },
  ];
}

async function getTree(repoUrl) {
  const { owner, repo, ref } = parseGitHubUrl(repoUrl);
  let branch = ref;
  
  try {
    if (!branch) {
      const defaultBranch = await getDefaultBranch(owner, repo);
      branch = defaultBranch;
    }
    const treeApiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const treeData = await fetchJSON(treeApiUrl);
    const tree = trimTreeEntries(treeData.tree);
    return buildNodesAndEdges(tree);
  } catch (error) {
    console.warn(`GitHub API failed: ${error.message}`);
    // Re-throw the error so the user knows what happened
    throw new Error(`Failed to fetch repository: ${error.message}. Please try again later or check if the repository URL is correct.`);
  }
}

export { getTree };
export default getTree;
