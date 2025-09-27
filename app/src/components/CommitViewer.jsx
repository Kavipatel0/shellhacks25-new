import React, { useState } from "react";
import CommitPreview from "./CommitPreview";

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
  else if (parts.length === 3)
    return { owner: parts[0], repo: parts[1], commit: parts[2] };
  return null;
}

export default function CommitViewer() {
  const [input, setInput] = useState("SobaSkee/portfolio-v2");
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [embedTarget, setEmbedTarget] = useState(null);

  const fetchCommits = async () => {
    setError(null);
    const parsed = parseRepoInput(input.trim());
    console.log(parsed);
    if (!parsed) return setError("Enter owner/repo or full GitHub URL");
    setLoading(true);
    try {
      let fetchUrl = "";
      if (parsed.commit) {
        fetchUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${parsed.commit}`;
      } else {
        fetchUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=10`;
      }
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();
      // Normalize data structure - single commit is an object, multiple commits is an array
      setCommits(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message);
      setCommits([]);
    } finally {
      setLoading(false);
    }
  };

  const openEmbed = async (commit) => {
    const parsed = parseRepoInput(input.trim());
    if (!parsed) return setError("Enter owner/repo or full GitHub URL");
    
    // If no commit specified, use the first commit from the list
    const commitToUse = commit || (commits.length > 0 ? commits[0].sha : null);
    if (!commitToUse) return setError("No commit available to preview");
    
    const embedTarget = `${parsed.owner}-${parsed.repo}-${commitToUse}`;
    console.log(embedTarget);
    
    // Start the Docker container by making a POST request to the backend
    try {
      setPreviewLoading(true);
      setError(null);
      const response = await fetch('http://localhost:4000/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: parsed.owner,
          repo: parsed.repo,
          commit: commitToUse
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start preview: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Preview started:', result);
      setEmbedTarget(embedTarget);
    } catch (err) {
      setError(`Failed to start preview: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Commit Viewer</h1>
          <p className="text-gray-600">Explore and preview GitHub commits in real-time</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="owner/repo or full GitHub URL (e.g. facebook/react)"
            />
          </div>
          <button
            onClick={fetchCommits}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Fetching..." : "Fetch Commits"}
          </button>
          {commits.length > 0 && (
            <button
              onClick={() => openEmbed()}
              disabled={previewLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewLoading ? "Starting..." : "Preview Latest"}
            </button>
          )}
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {previewLoading && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            Starting preview container...
          </div>
        )}
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Left Side - Commits List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {commits.length > 0 ? `Commits (${commits.length})` : "Commits"}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading commits...
              </div>
            ) : commits.length > 0 ? (
              <div className="p-2">
                {commits.map((c, index) => (
                  <div
                    key={c.sha}
                    className={`mb-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                      embedTarget === `${parseRepoInput(input.trim())?.owner}-${parseRepoInput(input.trim())?.repo}-${c.sha}`
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => openEmbed(c.sha)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                          {c.commit.message.split("\n")[0]}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {c.sha.substring(0, 7)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        #{commits.length - index}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{c.commit.author?.name}</span>
                      <span>{new Date(c.commit.author?.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <a
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on GitHub
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEmbed(c.sha);
                        }}
                        disabled={previewLoading}
                        className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                      >
                        {previewLoading ? "Starting..." : "Preview"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No commits loaded yet</p>
                <p className="text-sm">Enter a repository and click "Fetch Commits"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 bg-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
            <p className="text-sm text-gray-600">Interactive preview of your selected commit</p>
          </div>
          
          <div className="flex-1 p-4">
            {embedTarget ? (
              <CommitPreview id={embedTarget} />
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-lg font-medium mb-2">Ready to Preview</h3>
                  <p>Select a commit from the list to see a live preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
