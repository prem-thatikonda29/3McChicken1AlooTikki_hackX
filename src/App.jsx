import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Form from "./components/Form2";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="form" element={<Form />} />
      </Routes>
    </Router>
  );
}

export default App;
