import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-[#0f1115] text-white py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Top Links */}
        <div className="flex gap-8 text-sm tracking-wide mb-6">
          <Link to="/privacy" className="hover:text-gray-300 transition">
            Privacy Policy
          </Link>

          <Link to="/terms" className="hover:text-gray-300 transition">
            Terms and Conditions
          </Link>
        </div>

        {/* Company Name Centered */}
        <div className="text-lg font-medium mb-6">Attest BioSciences</div>

        {/* Bottom Row */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center text-sm text-gray-300 mt-6">
          <div className="text-center md:text-left">
            Copyright © 2026 Attest BioSciences - All Rights Reserved.
          </div>

          {/* Right side intentionally empty to match screenshot without GoDaddy */}
          <div className="hidden md:block"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
