import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-[#0f1115] text-white py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Links */}
        <div className="flex gap-8 text-sm tracking-wide mb-8">
          <Link to="/privacy" className="hover:text-gray-300 transition">
            Privacy Policy
          </Link>

          <Link to="/terms" className="hover:text-gray-300 transition">
            Terms and Conditions
          </Link>
        </div>

        {/* Company Name */}
        <div className="text-lg font-semibold mb-4">Attest BioSciences LLC</div>

        {/* Address */}
        <div className="text-sm text-gray-300 leading-relaxed mb-4">
          803 Bombay Lane <br />
          Suite C <br />
          Roswell, GA 30076
        </div>

        {/* CLIA Number */}
        <div className="text-sm text-gray-400 mb-8">
          CLIA Number: 11D2338301
        </div>

        {/* Divider */}
        <div className="w-full max-w-md h-px bg-white/10 mb-8" />

        {/* Copyright */}
        <div className="text-sm text-gray-400">
          Copyright © 2026 Attest BioSciences LLC - All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
