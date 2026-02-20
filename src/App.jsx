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
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import WaitList from "./components/WaitList";
import React, { useEffect, useState } from "react";

const App = () => {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "") || "/";
  const [showFooter, setShowFooter] = useState(true);

  async function fetchPublicSiteSettings() {
    try {
      const API_BASE = (import.meta.env.VITE_PUBLIC_API_BASE || "").replace(
        /\/+$/,
        "",
      );

      if (!API_BASE) {
        console.warn(
          "VITE_PUBLIC_API_BASE is not set; defaulting show_footer=true",
        );
        return { show_footer: true };
      }

      const url = `${API_BASE}/api/public/site-settings`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "settings fetch failed");

      const json = JSON.parse(text);
      return { show_footer: json?.show_footer ?? true };
    } catch (e) {
      console.warn("fetchPublicSiteSettings failed:", e);
      return { show_footer: true };
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await fetchPublicSiteSettings();
      if (!alive) return;
      setShowFooter(!!s.show_footer);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Router basename={base}>
      <Header />

      <Routes>
        <Route path="/" element={<Hero />} />
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
        <Route path="/wait" element={<WaitList />} />
        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showFooter ? <Footer /> : null}
    </Router>
  );
};

export default App;
