import About from "./components/About";
import BookAppointment from "./components/BookAppointment";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import Tips from "./components/Tips";
import TeamSection from "./components/TeamSection";

const App = () => {
  return (
    <div>
      <Header />
      <Hero />
      <Services />
      <About />
      <Tips />
      <BookAppointment />
      <Testimonials />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default App;
