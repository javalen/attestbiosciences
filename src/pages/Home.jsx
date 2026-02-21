import { NavLink, Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import bg from "../assets/home2.png"; // <-- updated image
import Footer from "@/components/Footer";
import { TestsIndex } from "@/components/TestComponent";

const Home = () => {
  console.log("Rendering Home");

  return (
    <>
      <div className="relative w-full overflow-hidden flex items-end h-[min(78vh,720px)]">
        <img
          src={bg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: "50% 15%",
            filter: "brightness(1.06) contrast(1.02) saturate(1.02)", // subtle lift like original
          }}
        />

        {/* Attest-like cool/blue film + mild darkening */}
        <div className="absolute inset-0 bg-[#20384a]/25" />
        <div className="absolute inset-0 bg-black/10" />

        {/* Content block */}
        <div className="relative z-10 ml-[18%] pb-[92px] max-w-3xl text-white">
          <h1
            className="
        text-[44px] md:text-[58px]
        font-semibold
        tracking-[0.02em]
        leading-[1.05]
        mb-4
      "
            style={{
              textShadow: "0 2px 18px rgba(0,0,0,0.35)", // original has a soft lift
            }}
          >
            Stay Healthy, Stay Happy
          </h1>

          <p
            className="text-[13px] md:text-[15px] tracking-[0.22em] uppercase text-white/90"
            style={{
              textShadow: "0 2px 14px rgba(0,0,0,0.30)",
            }}
          >
            Empowering Health, One Test at a Time
          </p>
        </div>
      </div>

      <TestsIndex />
    </>
  );
};

export default Home;
