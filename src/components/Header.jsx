import { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Loader2, Trash2 } from "lucide-react";
import pb from "@/db/pocketbase";

/* -------------------------------------------------------------------------- */
/*                                API helpers                                 */
/* -------------------------------------------------------------------------- */
const DATA_SERVER_BASE = String(
  import.meta.env.VITE_PUBLIC_API_BASE || "",
).replace(/\/+$/, "");

async function apiFetch(path, { method = "GET", body, signal } = {}) {
  if (!DATA_SERVER_BASE) {
    throw new Error("Missing VITE_PUBLIC_API_BASE");
  }

  const headers = { "Content-Type": "application/json" };

  // Send PB JWT if available
  if (pb?.authStore?.isValid && pb?.authStore?.token) {
    headers.Authorization = `Bearer ${pb.authStore.token}`;
  }

  const res = await fetch(`${DATA_SERVER_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------ Cart helpers ------------------------------ */
function countTestsInCart(cart) {
  const t = cart?.test;
  const te = cart?.expand?.test;
  if (Array.isArray(t)) return t.length;
  if (Array.isArray(te)) return te.length;
  if (t || te) return 1;
  return 0;
}

async function findOpenCart(expand = false, signal) {
  const qs = expand ? "?expandTest=1" : "";
  try {
    return await apiFetch(`/cart/open${qs}`, { signal });
  } catch (e) {
    if (String(e?.message || "").includes("404")) return null;
    throw e;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */
const navLinkBase =
  "text-white hover:text-white transition-colors duration-200 text-[16px] tracking-[0.16em] font-bold h-[40px] flex items-center";

const menuItem =
  "block w-full text-left text-white hover:text-white transition-colors duration-150 text-[13px] tracking-[0.18em] font-semibold py-2";

function SolidUserIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5z" />
      <path d="M12 14c-4.418 0-8 2.239-8 5v1c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-1c0-2.761-3.582-5-8-5z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isLoggedIn = pb.authStore.isValid && !!pb.authStore.model;

  const [openAccount, setOpenAccount] = useState(false);
  const menuRef = useRef(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const openCart = () => {
    if (!isLoggedIn) {
      navigate("/login/signin", {
        state: { redirectTo: location.pathname + location.search },
      });
      return;
    }
    setCartOpen(true);
    setOpenAccount(false); // close dropdown if coming from Orders
  };

  // Refresh cart count
  const refreshCartCount = useCallback(async () => {
    if (!pb.authStore.isValid || !pb.authStore.model) {
      setCartCount(0);
      return;
    }
    try {
      const cart = await findOpenCart(false);
      setCartCount(countTestsInCart(cart));
    } catch {
      setCartCount(0);
    }
  }, []);

  // On mount + on auth changes refresh cart count
  useEffect(() => {
    refreshCartCount();
    const unsub = pb.authStore.onChange(() => {
      refreshCartCount();
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [refreshCartCount]);

  const handleLogout = () => {
    pb.authStore.clear();
    setCartCount(0);
    setOpenAccount(false);
    setCartOpen(false);
    navigate("/", { replace: true });
  };

  // Close dropdown on outside click + ESC
  useEffect(() => {
    function onDown(e) {
      if (e.key === "Escape") setOpenAccount(false);
    }
    function onClick(e) {
      if (!openAccount) return;
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpenAccount(false);
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("mousedown", onClick);
    };
  }, [openAccount]);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 w-full z-50
          transition-colors duration-300
          ${isHome ? "bg-transparent" : "bg-black"}
        `}
      >
        <div className="px-[56px] pt-[26px] pb-[18px]">
          <div className="flex items-center justify-between">
            {/* LEFT */}
            <nav className="flex items-center gap-[56px]">
              <NavLink to="/" end>
                {({ isActive }) => (
                  <span className={navLinkBase}>
                    {isActive && <span className="mr-2">-</span>}
                    Home
                  </span>
                )}
              </NavLink>

              <NavLink to="/about">
                {({ isActive }) => (
                  <span className={navLinkBase}>
                    {isActive && <span className="mr-2">-</span>}
                    About
                  </span>
                )}
              </NavLink>

              <NavLink to="/team">
                {({ isActive }) => (
                  <span className={navLinkBase}>
                    {isActive && <span className="mr-2">-</span>}
                    Team
                  </span>
                )}
              </NavLink>

              <NavLink to="/contact">
                {({ isActive }) => (
                  <span className={navLinkBase}>
                    {isActive && <span className="mr-2">-</span>}
                    Contact
                  </span>
                )}
              </NavLink>

              <NavLink to="/tests">
                {({ isActive }) => (
                  <span className={navLinkBase}>
                    {isActive && <span className="mr-2">-</span>}
                    Our Test
                  </span>
                )}
              </NavLink>
            </nav>

            {/* RIGHT */}
            <div className="flex items-center gap-[22px] text-white/80">
              <button
                type="button"
                aria-label="Search"
                className="hover:text-white transition-colors duration-200"
              >
                <Search size={18} strokeWidth={1.4} />
              </button>

              {/* Cart (old logic) */}
              {isLoggedIn && (
                <button
                  type="button"
                  aria-label="Cart"
                  className="relative hover:text-white transition-colors duration-200"
                  onClick={() => setCartOpen(true)}
                  title="Cart"
                >
                  <ShoppingCart size={18} strokeWidth={1.4} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 text-[10px] leading-none bg-white text-black px-1.5 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* Account dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Account"
                  aria-expanded={openAccount}
                  className="hover:text-white transition-colors duration-200"
                  onClick={() => setOpenAccount((v) => !v)}
                >
                  {isLoggedIn ? (
                    <SolidUserIcon size={18} />
                  ) : (
                    <User size={18} strokeWidth={1.4} />
                  )}
                </button>

                {openAccount && (
                  <div
                    className="
                      absolute right-0 mt-4 w-[280px]
                      bg-[#0d0f12]/95
                      shadow-[0_12px_30px_rgba(0,0,0,0.45)]
                      border border-white/5
                      px-8 py-6
                    "
                  >
                    {!isLoggedIn ? (
                      <>
                        <NavLink
                          to="/login/signin"
                          onClick={() => setOpenAccount(false)}
                        >
                          {({ isActive }) => (
                            <span className={menuItem}>
                              {isActive && <span className="mr-2">-</span>}
                              Login
                            </span>
                          )}
                        </NavLink>

                        <NavLink
                          to="/login/signup"
                          onClick={() => setOpenAccount(false)}
                        >
                          {({ isActive }) => (
                            <span className={menuItem}>
                              {isActive && <span className="mr-2">-</span>}
                              Create Account
                            </span>
                          )}
                        </NavLink>
                      </>
                    ) : (
                      <>
                        <button
                          className={menuItem}
                          type="button"
                          onClick={openCart}
                        >
                          Orders
                        </button>
                        <button className={menuItem} type="button">
                          My Account
                        </button>

                        <div className="my-4 h-px bg-white/10" />

                        <button
                          onClick={handleLogout}
                          className={menuItem}
                          type="button"
                        >
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* /RIGHT */}
          </div>
        </div>
      </header>

      {/* Cart drawer (old header logic) */}
      <CartDrawer
        open={cartOpen}
        onClose={() => {
          setCartOpen(false);
          refreshCartCount(); // refresh count after removals
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 CartDrawer                                 */
/* -------------------------------------------------------------------------- */
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
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      if (!open) return;

      setError("");
      setLoading(true);
      try {
        if (!pb.authStore.isValid || !pb.authStore.model) {
          navigate("/login/signin");
          return;
        }

        const c = await findOpenCart(true /* expand */, ac.signal);
        setCart(c);
      } catch (e) {
        setError(e?.message || "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, navigate]);

  const tests = cart?.expand?.test ?? [];
  const subtotalCents = tests.reduce((sum, t) => sum + cents(t.cost), 0);
  const discountCents = 0;
  const taxCents = 0;
  const shippingCents = 0;
  const totalCents = subtotalCents - discountCents + taxCents + shippingCents;

  async function updateCartTests(nextTestIds) {
    if (!cart) return null;
    return apiFetch(`/cart/${cart.id}`, {
      method: "PATCH",
      body: {
        test: nextTestIds,
        last_activity_at: new Date().toISOString(),
      },
    });
  }

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

      const updated = await updateCartTests(next);
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
      const updated = await updateCartTests([]);
      setCart(updated);
    } catch (e) {
      setError(e?.message || "Could not clear cart.");
    } finally {
      setLoading(false);
    }
  }

  function goCheckout() {
    navigate("/checkout");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity z-[60] ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl border-l border-slate-200 transform transition-transform z-[61] ${
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
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Totals & Actions */}
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
