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

  if (!preview) return <p>Loading…</p>;
  if (preview.status !== "ready") return <p>Status: {preview.status}</p>;

  return (
    <div className="preview-container">
      <iframe
        src={preview.url}
        title="Commit Preview"
        width="100%"
        height="600px"
        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
      />
    </div>
  );
}
