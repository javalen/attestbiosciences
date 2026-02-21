import { Routes, Route } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Team from "./pages/Team";
import Contacts from "./pages/Contacts";
import { TestsIndex } from "./components/TestComponent";
import { TestDetail } from "./components/TestComponent";
import AuthPage from "./components/AuthPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team />} />
        <Route path="/contact" element={<Contacts />} />
        <Route path="/tests/:id" element={<TestDetail />} />
        <Route path="/tests" element={<TestsIndex />} />
        <Route path="/login/:mode" element={<AuthPage />} />
      </Route>
    </Routes>
  );
}
