import { useEffect, useState } from "react";

export default function CommitPreview({ id }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    async function fetchStatus() {
      const res = await fetch(`http://localhost:4000/api/preview/${id}/status`);
      const data = await res.json();
      setPreview(data);
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // poll every 3s
    return () => clearInterval(interval);
  }, [id]);

  if (!preview) {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (preview.status === "cloning") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Cloning repository...</p>
        </div>
      </div>
    );
  }

  if (preview.status === "building") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Building Docker container...</p>
        </div>
      </div>
    );
  }

  if (preview.status === "running") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Starting preview server...</p>
        </div>
      </div>
    );
  }

  if (preview.status === "error") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center text-red-400">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Preview Error</h3>
          <p className="text-sm">{preview.error || "Failed to start preview"}</p>
        </div>
      </div>
    );
  }

  if (preview.status !== "ready") {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">⏳</div>
          <p>Status: {preview.status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="h-full">
        <iframe
          src={preview.url}
          title="Commit Preview"
          className="w-full h-full border-0"
          style={{ minHeight: "100%" }}
        />
      </div>
    </div>
  );
}
