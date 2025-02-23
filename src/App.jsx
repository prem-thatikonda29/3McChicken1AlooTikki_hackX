import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
// import Form from "./components/Form2";
import Home from "./components/Home";
import Landing from "./components/Landing";
import DynamicQuestions from "./components/DynamicQuestions2";
import NearbyHospitalsOSM from "./components/Map";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                {/* <Route path="/form" element={<Form />} /> */}
                <Route path="/questions" element={<DynamicQuestions />} />
                {/* <Route path="/home" element={<Home />} /> */}
                <Route path="/map" element={<NearbyHospitalsOSM />} />
            </Routes>
        </Router>
    );
}

export default App;
