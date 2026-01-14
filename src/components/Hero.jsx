import { useEffect, useRef, useState } from "react";
import { CalendarCheck } from "lucide-react";
import bg from "../assets/home-testing.png"; // <-- your saved image
import { NavLink, Link } from "react-router-dom";

const Hero = () => {
  const [showPopup, setShowPopup] = useState(false);
  const timerRef = useRef(null);
  const popupTimerRef = useRef(null);

  useEffect(() => {
    // open a popup every 90s
    timerRef.current = setInterval(() => {
      setShowPopup(true);

      // auto-hide popup after 12s so it doesn't linger forever
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      popupTimerRef.current = setTimeout(() => setShowPopup(false), 12000);
    }, 30_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative isolate min-h-[100svh] overflow-hidden"
    >
      {/* Full-bleed background image */}
      <img
        src={bg}
        alt="Home testing made easy"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      {/* Soft overlay for text readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/20 to-white/85" />

      <div className="container mx-auto px-6 sm:px-10 lg:px-20 py-16 lg:py-24 flex items-center min-h-[100svh]">
        <div className="max-w-2xl space-y-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
            Home Testing, Delivered.
          </h1>
          <p className="text-slate-800 text-base lg:text-lg">
            Skip the waiting room and get clinical-grade results from the
            comfort of home. We’re rolling out a new lineup of convenient,
            accurate at-home tests be among the first to try them.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to="/tests"
              className="inline-flex items-center bg-sky-600 text-white px-5 py-3 rounded-xl hover:bg-sky-700 transition text-base font-medium shadow"
            >
              <CalendarCheck className="w-5 h-5 mr-2" />
              Explore Tests
            </NavLink>

            <Link
              to="/wait"
              className="inline-flex items-center px-5 py-3 rounded-xl border border-sky-600 text-sky-700 hover:bg-sky-50 transition text-base font-medium"
            >
              Join the Waitlist
            </Link>
          </div>

          <p className="text-sm text-slate-600">
            Limited early access. Join the waitlist now and get notified when
            at-home testing goes live.
          </p>
        </div>
      </div>

      {/* Recurring "Join Now" popup */}
      {showPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">
                Home Testing is Coming
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                Be first in line join our early access waitlist.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to="/wait"
                  className="inline-flex items-center px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-sm"
                >
                  Join Now
                </Link>
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm text-slate-700"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
