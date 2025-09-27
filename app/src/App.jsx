import "./App.css";
import FlowPage from "./components/pages/FlowPage";
import CommitViewer from "./components/CommitViewer";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col justify-start p-4 w-screen h-screen">
        <nav style={{ marginBottom: "1rem" }}>
          <Link to="/" style={{ marginRight: "1rem" }}>
            Flow Viewer
          </Link>
          <Link to="/commit-viewer">Commit Viewer</Link>
        </nav>

        <Routes>
          <Route path="/" element={<FlowPage />} />
          <Route path="/commit-viewer" element={<CommitViewer />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
