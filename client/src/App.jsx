import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/layout/SidebarLayout";

import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Quiz from "./pages/Quiz";
import Path from "./pages/Path";
import Asset from "./pages/Asset";
import Profile from "./pages/Profile";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout route */}
        <Route element={<SidebarLayout />}>

          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/path" element={<Path />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/asset/:assetId" element={<Asset />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<Profile />} /> {/* ✅ add */}

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

