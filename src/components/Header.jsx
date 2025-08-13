import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  PhoneCall,
  Menu,
  X,
  ShoppingCart,
  User,
  LogIn,
  ChevronDown,
  Loader2,
  Trash2,
} from "lucide-react";
// import PocketBase from "pocketbase"; // ❌ not needed
import pb from "@/db/pocketbase";
import AttestLogo from "@/assets/attest-logo.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },

  { to: "/tips", label: "Benefits" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/tests", label: "Our Tests" },
  { to: "/team", label: "Our Team" },
  { to: "/book", label: "Contact Us" },
];

const baseLink = "transition hover:text-sky-600";
const activeLink = "text-sky-600";

/* --- helpers shared by Header + CartDrawer --- */
function countTestsInCart(cart) {
  const t = cart?.test;
  const te = cart?.expand?.test;
  if (Array.isArray(t)) return t.length;
  if (Array.isArray(te)) return te.length;
  if (t || te) return 1;
  return 0;
}

async function findOpenCart(userId, expand = false) {
  try {
    return await pb
      .collection("cart")
      .getFirstListItem(
        `user = "${userId}" && status = "open"`,
        expand ? { expand: "test" } : {}
      );
  } catch (e) {
    if (e?.status === 404) return null;
    throw e;
  }
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile nav
  const [user, setUser] = useState(pb.authStore.model); // PocketBase user model or null
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null); // ✅ correct ref for plain JS
  const navigate = useNavigate();

  const loggedIn = pb.authStore.isValid && !!user;
  const displayName = user?.name || user?.username || user?.email || "Account";
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartId, setCartId] = useState(null);
  const subRef = useRef(null);
  const location = useLocation();

  // when auth changes, load cart + subscribe
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      // clear existing sub
      if (subRef.current && cartId) {
        try {
          await pb.collection("cart").unsubscribe(cartId);
        } catch {}
        subRef.current = null;
      }

      if (!pb.authStore.isValid || !pb.authStore.model) {
        setCartCount(0);
        setCartId(null);
        return;
      }

      const u = pb.authStore.model;
      const cart = await findOpenCart(u.id); // no expand needed for count
      if (cancelled) return;

      if (cart) {
        setCartId(cart.id);
        setCartCount(countTestsInCart(cart));
        // subscribe to this cart for live count updates
        await pb.collection("cart").subscribe(cart.id, (e) => {
          setCartCount(countTestsInCart(e.record));
        });
        subRef.current = cart.id;
      } else {
        setCartId(null);
        setCartCount(0);
      }
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, [pb.authStore.isValid, pb.authStore.model?.id]);

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
      <div className="w-full flex items-center justify-between gap-4 py-4 px-4 lg:px-8">
        {/* Logo -> link to home */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src={AttestLogo}
            alt="Attest BioSciences"
            className="h-12 md:h-14 w-auto object-contain"
          />
          {/* Hide the text label until extra-large screens */}
          <span className="hidden lg:inline xl:hidden text-xl font-bold text-sky-600 whitespace-nowrap">
            Attest
          </span>
          {/* full label on large+ screens */}
          <span className="hidden xl:inline text-2xl 2xl:text-3xl font-bold text-sky-600 whitespace-nowrap">
            Attest BioSciences
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex flex-1 justify-center gap-6 text-gray-700 font-medium min-w-0 whitespace-nowrap overflow-x-auto">
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
        <div className="hidden md:flex items-center gap-4 shrink-0 whitespace-nowrap">
          {/* <div className="hidden lg:flex items-center space-x-2 pr-2 border-r border-slate-200">
            <PhoneCall className="text-sky-600" />
            <Link
              to="/book"
              className="bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-700 transition text-sm"
            >
              Questions?
            </Link>
          </div> */}

          {/* Auth-aware area */}
          {loggedIn ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!loggedIn) {
                    navigate("/login", {
                      state: {
                        redirectTo: location.pathname + location.search,
                      },
                    });
                    return;
                  }
                  setCartOpen(true);
                }}
                aria-label="Shopping cart"
                className="relative p-2 rounded-lg hover:bg-slate-100"
                title="Cart"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] leading-none bg-sky-600 text-white px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <User className="w-5 h-5 text-slate-700" />
                  <span className="hidden xl:inline text-sm font-medium text-slate-800">
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
        <div className="lg:hidden">
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
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-md px-4 py-4 space-y-3 text-gray-700 font-medium">
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
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
};

export default Header;

function formatUSD(n) {
  const v = Number.parseFloat(n ?? 0);
  if (Number.isNaN(v)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `$${v}`;
  }
}

function cents(n) {
  const v = Number.parseFloat(n ?? 0);
  if (Number.isNaN(v)) return 0;
  return Math.round(v * 100);
}

function displayFromCents(c) {
  return formatUSD((c || 0) / 100);
}

function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null); // expanded with tests
  const [error, setError] = useState("");

  // load the cart with expanded tests when opened
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open) return;
      setError("");
      setLoading(true);
      try {
        if (!pb.authStore.isValid || !pb.authStore.model) {
          navigate("/login");
          return;
        }
        const u = pb.authStore.model.id;
        const c = await findOpenCart(u, true /* expand */);
        if (!cancelled) setCart(c);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load cart.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const tests = cart?.expand?.test ?? [];
  const subtotalCents = tests.reduce((sum, t) => sum + cents(t.cost), 0);
  const discountCents = 0;
  const taxCents = 0; // plug in your tax calc here
  const shippingCents = 0;
  const totalCents = subtotalCents - discountCents + taxCents + shippingCents;

  async function removeTest(testId) {
    if (!cart) return;
    setLoading(true);
    setError("");
    try {
      const current = Array.isArray(cart.test)
        ? cart.test.slice()
        : cart.test
        ? [cart.test]
        : [];
      const next = current.filter((id) => id !== testId);
      const updated = await pb.collection("cart").update(
        cart.id,
        {
          test: next,
          last_activity_at: new Date().toISOString(),
        },
        { expand: "test" }
      );
      setCart(updated);
    } catch (e) {
      setError(e?.message || "Could not remove item.");
    } finally {
      setLoading(false);
    }
  }

  async function clearCart() {
    if (!cart) return;
    setLoading(true);
    setError("");
    try {
      const updated = await pb.collection("cart").update(
        cart.id,
        {
          test: [],
          last_activity_at: new Date().toISOString(),
        },
        { expand: "test" }
      );
      setCart(updated);
    } catch (e) {
      setError(e?.message || "Could not clear cart.");
    } finally {
      setLoading(false);
    }
  }

  function goCheckout() {
    // wire this to your checkout route/page
    navigate("/checkout");
  }

  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* drawer */}
      <aside
        className={`fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl border-l border-slate-200 transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-160px)]">
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-800 p-3 text-sm">
              {error}
            </div>
          )}

          {!loading && tests.length === 0 && (
            <div className="text-slate-600">Your cart is empty.</div>
          )}

          <ul className="space-y-3">
            {tests.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {t.name}
                  </div>
                  <div className="text-sm text-slate-600 line-clamp-2">
                    {t.description}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {formatUSD(t.cost)}
                  </div>
                </div>
                <button
                  onClick={() => removeTest(t.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm hover:bg-slate-50"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* totals & actions */}
        <div className="border-t border-slate-200 p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-700">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">
              {displayFromCents(subtotalCents)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-700">
            <span>Discounts</span>
            <span className="font-medium text-slate-900">
              {displayFromCents(discountCents)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-700">
            <span>Tax</span>
            <span className="font-medium text-slate-900">
              {displayFromCents(taxCents)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-700">
            <span>Shipping</span>
            <span className="font-medium text-slate-900">
              {displayFromCents(shippingCents)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold text-slate-900 pt-1">
            <span>Total</span>
            <span>{displayFromCents(totalCents)}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              disabled={tests.length === 0 || loading}
              className="rounded-xl border border-slate-300 px-3 py-2 hover:bg-slate-50 disabled:opacity-60"
            >
              Clear
            </button>
            <button
              onClick={goCheckout}
              disabled={tests.length === 0}
              className="rounded-xl bg-sky-600 text-white px-3 py-2 hover:bg-sky-700 disabled:opacity-60"
            >
              Checkout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
