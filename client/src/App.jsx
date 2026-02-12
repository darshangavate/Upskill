import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Path from "./pages/Path";
import Asset from "./pages/Asset";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/path" element={<Path />} />
        <Route path="/quiz" element={<Quiz />} />

        {/* ✅ new learning page */}
        <Route path="/asset/:assetId" element={<Asset />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
