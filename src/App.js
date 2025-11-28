import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FloodMapPage from "./pages/FloodMapPage";
import Preparedness from "./pages/Preparedness";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<FloodMapPage />} />
        <Route path="/preparedness" element={<Preparedness />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;