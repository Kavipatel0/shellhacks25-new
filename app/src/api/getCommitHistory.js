function parseRepoInput(input) {
  // Accept full URL or owner/repo
  try {
    const url = new URL(input);
    // github.com/owner/repo
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
  } catch {
    // not a url
  }
  const parts = input.split("/").filter(Boolean);
  if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
  return null;
}

/**
 * Fetches commit history for a GitHub repository
 * @param {string} repoUrl - GitHub repository URL
 * @param {number} limit - Maximum number of commits to fetch (default: 20)
 * @returns {Promise<Array>} Array of commit objects with sha, message, author, date
 */
async function getCommitHistory(repoUrl, limit = 20) {
  try {
    console.log('getCommitHistory called with:', repoUrl);
    const parsed = parseRepoInput(repoUrl.trim());
    console.log('Parsed result:', parsed);
    
    if (!parsed) {
      throw new Error("Enter owner/repo or full GitHub URL");
    }

    const { owner, repo } = parsed;
    const fetchUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`;
    console.log('Fetching from URL:', fetchUrl);
    
    const response = await fetch(fetchUrl);
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
    }
    
    const commitsData = await response.json();
    console.log('Raw commits data:', commitsData);

    // Format commit data for the dropdown (same format as CommitViewer)
    const formattedCommits = commitsData.map(commit => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0], // First line only
      author: commit.commit.author?.name || 'Unknown',
      date: new Date(commit.commit.author?.date).toLocaleDateString(),
      fullDate: commit.commit.author?.date,
      html_url: commit.html_url
    }));

    console.log('Formatted commits:', formattedCommits);
    return formattedCommits;
  } catch (error) {
    console.error('Error fetching commit history:', error);
    throw new Error(`Failed to fetch commit history: ${error.message}`);
  }
}

export { getCommitHistory };
export default getCommitHistory;
