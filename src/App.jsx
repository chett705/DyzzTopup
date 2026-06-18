import { BrowserRouter, Routes, Route } from "react-router-dom";
import Game from "./api/Game";
import Packages from "./api/Packages";
import Orders from "./api/Orders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/games/:id" element={<Packages />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:orderNo" element={<Orders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
