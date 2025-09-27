import React, { useState } from "react";

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

export default function CommitViewer() {
  const [input, setInput] = useState("facebook/react");
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [embedTarget, setEmbedTarget] = useState(null);

  const fetchCommits = async () => {
    setError(null);
    const parsed = parseRepoInput(input.trim());
    if (!parsed) return setError("Enter owner/repo or full GitHub URL");
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=10`
      );
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();
      setCommits(data);
    } catch (err) {
      setError(err.message);
      setCommits([]);
    } finally {
      setLoading(false);
    }
  };

  const openEmbed = (type) => {
    const parsed = parseRepoInput(input.trim());
    if (!parsed) return setError("Enter owner/repo or full GitHub URL");
    if (type === "github.dev") {
      setEmbedTarget(`https://github.dev/${parsed.owner}/${parsed.repo}/`);
    } else if (type === "codesandbox") {
      // codesandbox can open github via https://codesandbox.io/s/github/owner/repo
      setEmbedTarget(
        `https://codesandbox.io/s/github/${parsed.owner}/${parsed.repo}`
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Commit Viewer</h2>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 flex-1"
          placeholder="owner/repo or full GitHub URL (e.g. facebook/react)"
        />
        <button
          onClick={fetchCommits}
          className="bg-blue-600 text-white px-3 py-2"
        >
          Fetch
        </button>
        <button
          onClick={() => openEmbed("github.dev")}
          className="bg-gray-800 text-white px-3 py-2"
        >
          Open in github.dev
        </button>
        <button
          onClick={() => openEmbed("codesandbox")}
          className="bg-green-700 text-white px-3 py-2"
        >
          Open in CodeSandbox
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {loading && <div>Loading commits...</div>}

      {!loading && commits && commits.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl mb-2">Latest commits</h3>
          <ul className="space-y-2">
            {commits.map((c) => (
              <li key={c.sha} className="border p-2">
                <div className="font-medium">
                  {c.commit.message.split("\n")[0]}
                </div>
                <div className="text-sm text-gray-600">
                  {c.commit.author?.name} •{" "}
                  {new Date(c.commit.author?.date).toLocaleString()}
                </div>
                <a
                  href={c.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  View on GitHub
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {embedTarget && (
        <div className="border p-2" style={{ height: "60vh" }}>
          <iframe
            src={embedTarget}
            title="embed"
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </div>
      )}
    </div>
  );
}
