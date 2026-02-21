import { useEffect, useMemo, useState } from "react";
import bg from "../assets/contacts.png";

export default function Contacts() {
  // "intro" = small box, "form" = big form box
  const [mode, setMode] = useState("intro");

  const isForm = mode === "form";

  // ESC closes form back to intro
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setMode("intro");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // These min-heights emulate the original:
  // - intro is shorter (footer sits closer)
  // - form is taller (footer gets pushed down)
  const minHeight = useMemo(() => {
    // tweak these 2 numbers to match your exact pixel height
    return isForm ? "980px" : "660px";
  }, [isForm]);

  return (
    <section
      className="
        relative w-full overflow-hidden
        transition-[min-height] duration-500 ease-in-out
      "
      style={{ minHeight }}
    >
      {/* Background */}
      <img
        src={bg}
        alt="Contact background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "40% 15%" }}
      />
      {/* Brightness overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content (in-flow so footer gets pushed down) */}
      <div className="relative z-10 w-full px-6">
        {/* spacing below header like the original */}
        <div className="pt-[150px] pb-[80px] flex flex-col items-center">
          <h1 className="text-white text-[44px] tracking-[0.18em] font-semibold mb-10 text-center">
            Get in Touch with Us
          </h1>

          {/* ===== STACK AREA ===== */}
          <div className="relative w-full flex justify-center">
            {/* SLOT: controls the shared top/left position for BOTH cards */}
            <div className="relative w-full max-w-[860px]">
              {/* INTRO CARD (fades out) */}
              <div
                className={`
        bg-white shadow-xl
        w-full
        px-16 py-14
        transition-all duration-400 ease-in-out
        ${isForm ? "opacity-0 translate-y-0 pointer-events-none" : "opacity-100 translate-y-0"}
      `}
              >
                <p className="text-[16px] leading-[1.9] text-gray-800 mb-10 text-center">
                  Have questions, concerns, or feedback? Click below to send us
                  a message, or email us at{" "}
                  <a
                    href="mailto:contact@attestbiosciences.com"
                    className="underline text-[#1e5f86]"
                  >
                    contact@attestbiosciences.com
                  </a>
                  .
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={() => setMode("form")}
                    className="px-10 py-4 border-2 border-black rounded-full tracking-[0.25em] text-[12px] font-semibold uppercase hover:bg-black hover:text-white transition-all duration-200"
                  >
                    Drop us a line!
                  </button>
                </div>
              </div>

              {/* FORM CARD (slides in) - ALWAYS absolute to match intro card's top position */}
              <div
                className={`
        absolute left-0 top-0 w-full
        transition-all duration-450 ease-out
        ${isForm ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-24 pointer-events-none"}
      `}
                style={{
                  // keep it from intercepting clicks when hidden
                  pointerEvents: isForm ? "auto" : "none",
                }}
              >
                <div className="bg-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] w-full px-20 py-14">
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setMode("intro")}
                    className="absolute right-10 top-7 text-black/70 hover:text-black text-2xl leading-none"
                  >
                    ×
                  </button>

                  <h2 className="text-center text-[18px] tracking-[0.22em] font-medium mb-5">
                    Drop us a line!
                  </h2>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setMode("intro");
                    }}
                    className="space-y-10"
                  >
                    <div>
                      <label className="block text-[14px] text-black/80 ">
                        Name*
                      </label>
                      <input
                        className="w-full border-b border-black/40 focus:border-black outline-none py-2"
                        type="text"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] text-black/80 ">
                        Email*
                      </label>
                      <input
                        className="w-full border-b border-black/40 focus:border-black outline-none py-2"
                        type="email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] text-black/80 ">
                        Message*
                      </label>
                      <textarea
                        className="w-full border-b border-black/40 focus:border-black outline-none py-2 min-h-[100px] resize-none"
                        required
                      />
                    </div>

                    <label className="flex items-center justify-center gap-3 text-[13px] text-black/70">
                      <input type="checkbox" className="h-4 w-4" />
                      Sign up for our email list for updates, promotions, and
                      more.
                    </label>

                    <p className="text-center text-[12px] text-black/35">
                      This site is protected by reCAPTCHA and the Google Privacy
                      Policy and Terms of Service apply.
                    </p>

                    <div className="pt-2 flex justify-center">
                      <button
                        type="submit"
                        className="px-14 py-3 border-2 border-black rounded-full tracking-[0.25em] text-[11px] font-semibold uppercase hover:bg-black hover:text-white transition-all duration-200"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
