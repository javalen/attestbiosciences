import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./components/About";
import BookAppointment from "./components/BookAppointment";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import Tips from "./components/Tips";
import TeamSection from "./components/TeamSection";
import { TestsIndex } from "./components/TestComponent";
import { TestDetail } from "./components/TestComponent";
import AuthPage from "./components/AuthPage";
import TestimonialNew from "./components/TestimonialNew";
import AdvisoryTeam from "./components/AdvisoryTeam";
import AdminPanel from "./components/AdminPanel";

const App = () => {
  return (
    <Router>
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <Services />
              <Tips />
              <Testimonials />
              <TeamSection />
            </>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/book" element={<BookAppointment />} />
        <Route path="/services" element={<Services />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/team" element={<TeamSection />} />
        <Route path="/tests" element={<TestsIndex />} />
        <Route path="/tests/:id" element={<TestDetail />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/testimonials/new" element={<TestimonialNew />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>

      <Footer />
    </Router>
  );
};

export default App;
