import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { spawnBuildAndRun, stopPreview } from "./preview.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const previews = new Map(); // store {id, status, url, logs}

app.post("/api/preview", async (req, res) => {
  const { owner, repo, commit } = req.body;
  if (!owner || !repo || !commit) {
    return res.status(400).json({ error: "owner, repo, commit required" });
  }

  const id = `${owner}-${repo}-${commit}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  previews.set(id, { status: "building", url: null, logs: [] });

  // async build/run
  spawnBuildAndRun({ owner, repo, commit, id }, (update) => {
    previews.set(id, { ...previews.get(id), ...update });
  });

  res.json({ id, status: "building" });
});

app.get("/api/preview/:id/status", (req, res) => {
  const preview = previews.get(req.params.id);
  if (!preview) return res.status(404).json({ error: "not found" });
  res.json(preview);
});

app.delete("/api/preview/:id", async (req, res) => {
  try {
    await stopPreview(req.params.id);
    previews.delete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Either stop the process using it or set a different PORT env var.`
    );
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});
