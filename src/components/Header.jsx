import { useState } from "react";
import { PhoneCall, Menu, Hospital, TestTubeDiagonal, X } from "lucide-react";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#tips", label: "Benefits" },
  { href: "#book", label: "Order Test" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#team", label: "Our Team" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="scroll-mt-20 bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <TestTubeDiagonal className="w-8 h-8 text-sky-600" />
          <span className="text-xl font-bold text-sky-600">
            Attest BioSciences
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-sky-600 transition"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Call to Action */}
        <div className="hidden md:flex items-center space-x-2">
          <PhoneCall className="text-sky-600" />
          <a
            href="#book"
            className="bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-700 transition text-sm"
          >
            Order Test
          </a>
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <X className="text-gray-700" />
            ) : (
              <Menu className="text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div
          className="md:hidden bg-white border-t border-gray-200 shadow-md px-4 py-4 
        space-y-3 text-gray-700 font-medium"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block hover:text-sky-600 transition"
              onClick={() => setIsMenuOpen(false)} // Close menu on link click
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
export default Header;
