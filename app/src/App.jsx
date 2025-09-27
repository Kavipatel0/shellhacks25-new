import "./App.css";
import FlowGraph from "./components/FlowGraph";
import CommitViewer from "./components/CommitViewer";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen p-0 m-0 flex flex-col">
        <nav className="p-4 bg-gray-900 text-white flex gap-4">
          <Link to="/" className="underline">
            Flow Graph
          </Link>
          <Link to="/commit-viewer" className="underline">
            Commit Viewer
          </Link>
        </nav>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<FlowGraph />} />
            <Route path="/commit-viewer" element={<CommitViewer />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
