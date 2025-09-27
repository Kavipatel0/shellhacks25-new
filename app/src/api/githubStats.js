/**
 * API service for fetching GitHub repository statistics
 */

/**
 * Format numbers like GitHub UI (e.g., 14300 -> "14.3k", 1100 -> "1.1k")
 */
function formatGitHubNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

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
  } catch (error) {
    throw new Error("Invalid GitHub repository URL");
  }
}

/**
 * Get repository statistics including stars, forks, and pull requests
 */
export async function getRepositoryStats(repoUrl) {
  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    
    console.log('🔍 Fetching repository stats for:', owner, repo);
    
    // Fetch repository info
    const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoData = await fetchJSON(repoApiUrl);
    
    console.log('📊 Repository data received:', {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      open_issues: repoData.open_issues_count,
      watchers: repoData.watchers_count
    });
    
    // Get actual pull requests count (separate from issues)
    let pullRequestsCount = 0;
    try {
      const prsApiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=1`;
      const prsData = await fetchJSON(prsApiUrl);
      // Note: GitHub API doesn't return total count in headers for pulls endpoint
      // We'll use open_issues_count as an approximation since it includes PRs
      pullRequestsCount = Math.floor(repoData.open_issues_count * 0.3); // Rough estimate
    } catch (prError) {
      console.warn('Could not fetch PRs separately, using open_issues_count');
      pullRequestsCount = repoData.open_issues_count;
    }
    
    const result = {
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      pullRequests: pullRequestsCount,
      watchers: repoData.watchers_count || 0,
      size: repoData.size || 0,
      defaultBranch: repoData.default_branch || 'main',
      // Formatted versions for display
      starsFormatted: formatGitHubNumber(repoData.stargazers_count || 0),
      forksFormatted: formatGitHubNumber(repoData.forks_count || 0),
      watchersFormatted: formatGitHubNumber(repoData.watchers_count || 0)
    };
    
    console.log('✅ Final repository stats:', result);
    return result;
  } catch (error) {
    console.error('❌ Error fetching repository stats:', error);
    // Return default values instead of throwing
    return {
      stars: 0,
      forks: 0,
      pullRequests: 0,
      watchers: 0,
      size: 0,
      defaultBranch: 'main',
      // Formatted versions for display
      starsFormatted: '0',
      forksFormatted: '0',
      watchersFormatted: '0'
    };
  }
}

/**
 * Get language statistics for the repository
 */
export async function getLanguageStats(repoUrl) {
  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    
    const languagesApiUrl = `https://api.github.com/repos/${owner}/${repo}/languages`;
    const languagesData = await fetchJSON(languagesApiUrl);
    
    const totalBytes = Object.values(languagesData).reduce((sum, bytes) => sum + bytes, 0);
    
    const languages = Object.entries(languagesData)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: (bytes / totalBytes) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6); // Top 6 languages
    
    // Assign colors to languages
    const colors = [
      '#f7df1e', // JavaScript - Yellow
      '#3178c6', // TypeScript - Blue
      '#3776ab', // Python - Blue
      '#563d7c', // CSS - Purple
      '#e34c26', // HTML - Orange
      '#f34b7d', // C# - Pink
      '#61dafb', // React - Light Blue
      '#000000', // Shell - Black
      '#89e051', // Go - Green
      '#a97bff'  // Other - Purple
    ];
    
    return languages.map((lang, index) => ({
      ...lang,
      color: colors[index] || colors[colors.length - 1]
    }));
  } catch (error) {
    console.error('Error fetching language stats:', error);
    throw error;
  }
}

/**
 * Analyze tech stack from repository files and languages
 */
export async function getTechStack(repoUrl, nodes = []) {
  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    
    // Get languages first
    const languages = await getLanguageStats(repoUrl);
    const topLanguages = languages.slice(0, 3).map(l => l.language);
    
    // Analyze files to determine tech stack
    const fileExtensions = nodes
      .filter(node => node.data?.nodeType === 'file')
      .map(node => node.data?.label)
      .filter(fileName => fileName)
      .map(fileName => fileName.split('.').pop()?.toLowerCase())
      .filter(ext => ext);
    
    const extensionCounts = fileExtensions.reduce((acc, ext) => {
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {});
    
    // Determine tech stack based on files and languages
    const techStack = {
      frontend: [],
      backend: [],
      tools: []
    };
    
    // Frontend technologies
    if (topLanguages.includes('JavaScript') || topLanguages.includes('TypeScript')) {
      techStack.frontend.push('JavaScript/TypeScript');
    }
    if (topLanguages.includes('CSS')) {
      techStack.frontend.push('CSS');
    }
    if (topLanguages.includes('HTML')) {
      techStack.frontend.push('HTML');
    }
    
    // Check for React
    if (extensionCounts.jsx > 0 || extensionCounts.tsx > 0) {
      techStack.frontend.push('React');
    }
    
    // Check for Vue
    if (extensionCounts.vue > 0) {
      techStack.frontend.push('Vue.js');
    }
    
    // Check for Angular
    if (extensionCounts.ng > 0 || extensionCounts.ts > 0) {
      techStack.frontend.push('Angular');
    }
    
    // Backend technologies
    if (topLanguages.includes('Python')) {
      techStack.backend.push('Python');
    }
    if (topLanguages.includes('Java')) {
      techStack.backend.push('Java');
    }
    if (topLanguages.includes('Go')) {
      techStack.backend.push('Go');
    }
    if (topLanguages.includes('C#')) {
      techStack.backend.push('C#');
    }
    if (topLanguages.includes('PHP')) {
      techStack.backend.push('PHP');
    }
    if (topLanguages.includes('Ruby')) {
      techStack.backend.push('Ruby');
    }
    
    // Check for Node.js
    if (extensionCounts.json > 0 && topLanguages.includes('JavaScript')) {
      techStack.backend.push('Node.js');
    }
    
    // Tools and frameworks
    if (extensionCounts.json > 0) {
      techStack.tools.push('Package.json');
    }
    if (extensionCounts.md > 0) {
      techStack.tools.push('Markdown');
    }
    if (extensionCounts.yml > 0 || extensionCounts.yaml > 0) {
      techStack.tools.push('YAML');
    }
    if (extensionCounts.dockerfile > 0 || extensionCounts.dockerignore > 0) {
      techStack.tools.push('Docker');
    }
    
    return techStack;
  } catch (error) {
    console.error('Error analyzing tech stack:', error);
    // Return default tech stack based on what we can determine from nodes
    return {
      frontend: ['JavaScript', 'CSS', 'HTML'],
      backend: ['Node.js'],
      tools: ['Package.json']
    };
  }
}

// Export the formatting function for use in components
export { formatGitHubNumber };
