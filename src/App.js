import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import FloodMapPage from "./pages/FloodMapPage";
import Preparedness from "./pages/Preparedness";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/map" element={<FloodMapPage />} />
          <Route path="/preparedness" element={<Preparedness />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;