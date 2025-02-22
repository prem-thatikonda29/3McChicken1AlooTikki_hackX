import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Form from "./components/Form2";
import Home from "./components/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="form" element={<Form />} />
        <Route path="home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
