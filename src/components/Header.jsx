import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  PhoneCall,
  Menu,
  TestTubeDiagonal,
  X,
  ShoppingCart,
  User,
  LogIn,
  ChevronDown,
} from "lucide-react";
// import PocketBase from "pocketbase"; // ❌ not needed
import pb from "@/db/pocketbase";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/tips", label: "Benefits" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/tests", label: "Our Tests" },
  { to: "/team", label: "Our Team" },
  { to: "/book", label: "Contact Us" },
];

const baseLink = "transition hover:text-sky-600";
const activeLink = "text-sky-600";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile nav
  const [user, setUser] = useState(pb.authStore.model); // PocketBase user model or null
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null); // ✅ correct ref for plain JS
  const navigate = useNavigate();

  const loggedIn = pb.authStore.isValid && !!user;
  const displayName = user?.name || user?.username || user?.email || "Account";

  // keep user state in sync with PB auth changes
  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setUser(pb.authStore.model);
    });
    return () => {
      // some PB versions return an unsubscribe fn; if not, this is a no-op
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // close user menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!isUserMenuOpen) return;
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isUserMenuOpen]);

  async function handleSignOut() {
    pb.authStore.clear();
    setIsUserMenuOpen(false);
    navigate("/");
  }

  return (
    <header className="scroll-mt-20 bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        {/* Logo -> link to home */}
        <Link to="/" className="flex items-center space-x-2">
          <TestTubeDiagonal className="w-8 h-8 text-sky-600" />
          <span className="text-xl font-bold text-sky-600">
            Attest BioSciences
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${baseLink} ${isActive ? activeLink : ""}`
              }
              end={link.to === "/"}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: CTA + Auth */}
        <div className="hidden md:flex items-center gap-4">
          <div className="hidden lg:flex items-center space-x-2 pr-2 border-r border-slate-200">
            <PhoneCall className="text-sky-600" />
            <Link
              to="/book"
              className="bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-700 transition text-sm"
            >
              You have questions?
            </Link>
          </div>

          {/* Auth-aware area */}
          {loggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                to="/cart"
                aria-label="Shopping cart"
                className="relative p-2 rounded-lg hover:bg-slate-100"
                title="Cart"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700" />
              </Link>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <User className="w-5 h-5 text-slate-700" />
                  <span className="text-sm font-medium text-slate-800">
                    {displayName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-2"
                  >
                    <Link
                      to="/account"
                      className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-800"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Edit information
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-800"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Recent orders
                    </Link>
                    <Link
                      to="/book"
                      className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-800"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Contact us
                    </Link>

                    <div className="my-1 border-t border-slate-200" />

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm text-sky-700"
              title="Log in / Create account"
            >
              <LogIn className="w-5 h-5" />
              <span>Log in / Create account</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen((s) => !s)}
          >
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
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md px-4 py-4 space-y-3 text-gray-700 font-medium">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block ${baseLink} ${isActive ? activeLink : ""}`
              }
              end={link.to === "/"}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Mobile auth area */}
          <div className="pt-3 mt-2 border-t border-slate-200">
            {loggedIn ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-5 h-5" />
                  <span className="text-sm">{displayName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/cart"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Cart
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  >
                    Sign out
                  </button>
                </div>
                <div className="grid gap-2">
                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-2 py-2 rounded hover:bg-slate-50 text-sm"
                  >
                    Edit information
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-2 py-2 rounded hover:bg-slate-50 text-sm"
                  >
                    Recent orders
                  </Link>
                  <Link
                    to="/book"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-2 py-2 rounded hover:bg-slate-50 text-sm"
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sky-700"
              >
                <LogIn className="w-5 h-5" />
                Log in / Create account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
