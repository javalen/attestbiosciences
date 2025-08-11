import { CalendarCheck } from "lucide-react";
import bg from "../assets/home-testing.png"; // <-- your saved image

const Hero = () => {
  return (
    <section
      id="home"
      className="relative isolate min-h-[100svh] overflow-hidden"
    >
      {/* Full-bleed background image */}
      <img
        src={bg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      {/* Soft overlay for text readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/10 to-white/85" />

      <div className="container mx-auto px-6 sm:px-10 lg:px-20 py-16 lg:py-24 flex items-center min-h-[100svh]">
        <div className="max-w-2xl space-y-6 bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
            Stay Healthy, Stay Happy
          </h1>
          <p className="text-slate-700 text-base lg:text-lg">
            Empowering Health, One Test at a Time.
          </p>
          <a
            href="#book"
            className="inline-flex items-center bg-sky-600 text-white px-5 py-3 rounded-xl hover:bg-sky-700 transition text-base font-medium shadow"
          >
            <CalendarCheck className="w-5 h-5 mr-2" />
            Order Test
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
