import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TextGeneration from "./pages/TextGeneration";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="text" element={<TextGeneration />} />
      </Route>
    </Routes>
  );
}

export default App;
