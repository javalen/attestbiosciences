import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, Loader2, Trash2 } from "lucide-react";
import pb from "@/db/pocketbase";
import abLogo from "@/assets/ab-logo.png";

/* -------------------------------------------------------------------------- */
/*                                API helpers                                 */
/* -------------------------------------------------------------------------- */
const DATA_SERVER_BASE = String(
  import.meta.env.VITE_PUBLIC_API_BASE || "",
).replace(/\/+$/, "");

async function apiFetch(path, { method = "GET", body, signal } = {}) {
  if (!DATA_SERVER_BASE) throw new Error("Missing VITE_PUBLIC_API_BASE");

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

const navLinkMobile =
  "block w-full text-left text-white hover:text-white transition-colors duration-150 text-[15px] tracking-[0.16em] font-bold py-3";

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

  const user = pb.authStore.model;
  const isAdmin = !!user?.isAdmin;

  const [openAccount, setOpenAccount] = useState(false);
  const menuRef = useRef(null);

  const [openMobileNav, setOpenMobileNav] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [cartMode, setCartMode] = useState("cart"); // ✅ "cart" | "orders"
  const [cartCount, setCartCount] = useState(0);

  const openCart = () => {
    if (!isLoggedIn) {
      navigate("/login/signin", {
        state: { redirectTo: location.pathname + location.search },
      });
      return;
    }
    setCartMode("cart");
    setCartOpen(true);
    setOpenAccount(false);
  };

  const openOrders = () => {
    if (!isLoggedIn) {
      navigate("/login/signin", {
        state: { redirectTo: location.pathname + location.search },
      });
      return;
    }
    setCartMode("orders"); // ✅ show orders inside drawer
    setCartOpen(true);
    setOpenAccount(false);
  };

  useEffect(() => {
    setOpenMobileNav(false);
    setOpenAccount(false);
  }, [location.pathname]);

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

  useEffect(() => {
    function onDown(e) {
      if (e.key === "Escape") {
        setOpenAccount(false);
        setOpenMobileNav(false);
      }
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
        <div className="px-4 sm:px-[56px] pt-3 sm:pt-[26px] pb-3 sm:pb-[18px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <NavLink
                to="/"
                aria-label="Home"
                className="flex items-center shrink-0"
              >
                <img
                  src={abLogo}
                  alt="Attest BioSciences"
                  className="h-[44px] sm:h-[72px] w-auto"
                  draggable={false}
                />
              </NavLink>

              <nav className="hidden md:flex items-center gap-[56px]">
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
            </div>

            <div className="flex items-center gap-3 sm:gap-[22px] text-white/80 shrink-0">
              <button
                type="button"
                aria-label={openMobileNav ? "Close menu" : "Open menu"}
                className="md:hidden hover:text-white transition-colors duration-200"
                onClick={() => {
                  setOpenMobileNav((v) => !v);
                  setOpenAccount(false);
                }}
              >
                {openMobileNav ? (
                  <X size={20} strokeWidth={1.6} />
                ) : (
                  <Menu size={20} strokeWidth={1.6} />
                )}
              </button>

              {/* Cart icon opens CART mode */}
              {isLoggedIn && (
                <button
                  type="button"
                  aria-label="Cart"
                  className="relative hover:text-white transition-colors duration-200"
                  onClick={openCart}
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
                        {/* ✅ Orders now opens the drawer in ORDERS mode */}
                        <button
                          className={menuItem}
                          type="button"
                          onClick={openOrders}
                        >
                          Orders
                        </button>

                        <button className={menuItem} type="button">
                          My Account
                        </button>

                        {isAdmin && (
                          <NavLink
                            to="/admin"
                            onClick={() => setOpenAccount(false)}
                          >
                            {({ isActive }) => (
                              <span className={menuItem}>
                                {isActive && <span className="mr-2">-</span>}
                                Admin Panel
                              </span>
                            )}
                          </NavLink>
                        )}

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
          </div>

          {openMobileNav && (
            <div className="md:hidden mt-3 rounded-xl bg-[#0d0f12]/95 border border-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.45)] overflow-hidden">
              <nav className="px-4 py-3">
                <NavLink to="/" end>
                  {({ isActive }) => (
                    <span className={navLinkMobile}>
                      {isActive && <span className="mr-2">-</span>}
                      Home
                    </span>
                  )}
                </NavLink>

                <NavLink to="/about">
                  {({ isActive }) => (
                    <span className={navLinkMobile}>
                      {isActive && <span className="mr-2">-</span>}
                      About
                    </span>
                  )}
                </NavLink>

                <NavLink to="/team">
                  {({ isActive }) => (
                    <span className={navLinkMobile}>
                      {isActive && <span className="mr-2">-</span>}
                      Team
                    </span>
                  )}
                </NavLink>

                <NavLink to="/contact">
                  {({ isActive }) => (
                    <span className={navLinkMobile}>
                      {isActive && <span className="mr-2">-</span>}
                      Contact
                    </span>
                  )}
                </NavLink>

                <NavLink to="/tests">
                  {({ isActive }) => (
                    <span className={navLinkMobile}>
                      {isActive && <span className="mr-2">-</span>}
                      Our Test
                    </span>
                  )}
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </header>

      <CartDrawer
        open={cartOpen}
        mode={cartMode} // ✅ pass mode down
        onClose={() => {
          setCartOpen(false);
          refreshCartCount();
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
      maximumFractionDigits: 2,
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

/**
 * Tax calc function (receives cents, returns cents)
 * Update logic/rate as needed.
 */
function calcTax(subtotalCents) {
  const rate = 0.0825; // e.g. 0.0825
  return Math.round((subtotalCents || 0) * rate);
}

function discountToCents(discountValue, subtotalCents) {
  const v = Number(discountValue);
  if (!Number.isFinite(v) || v <= 0) return 0;

  if (v > 0 && v <= 1) return Math.round((subtotalCents || 0) * v); // fraction percent
  if (v > 1 && v <= 100) return Math.round((subtotalCents || 0) * (v / 100)); // percent
  return cents(v); // dollars
}

function CartDrawer({ open, onClose, mode = "cart" }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");

  // Orders view state
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState("");
  const [orders, setOrders] = useState([]);

  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discountRec, setDiscountRec] = useState(null);
  const [discountStatus, setDiscountStatus] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // Load cart or orders when drawer opens / mode changes
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      if (!open) return;

      setError("");
      setOrdersErr("");
      setPurchaseSuccess(null);

      if (!pb.authStore.isValid || !pb.authStore.model) {
        navigate("/login/signin");
        return;
      }

      if (mode === "orders") {
        setOrdersLoading(true);
        try {
          // ✅ show the user's most recent orders
          const list = await pb.collection("orders").getList(1, 25, {
            filter: `user="${pb.authStore.model.id}"`,
            sort: "-created",
            expand: "tests,discount",
            requestKey: null,
          });
          setOrders(list?.items || []);
        } catch (e) {
          setOrdersErr(e?.message || "Failed to load orders.");
          setOrders([]);
        } finally {
          setOrdersLoading(false);
        }
        return;
      }

      // mode === "cart"
      setLoading(true);
      try {
        const c = await findOpenCart(true, ac.signal);
        setCart(c);

        // reset discount UI each open cart
        setDiscountCode("");
        setDiscountRec(null);
        setDiscountStatus("");
      } catch (e) {
        setError(e?.message || "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, mode, navigate]);

  const tests = cart?.expand?.test ?? [];
  const subtotalCents = useMemo(
    () => tests.reduce((sum, t) => sum + cents(t.cost), 0),
    [tests],
  );

  const discountCents = useMemo(() => {
    if (!discountRec) return 0;
    const dc = discountToCents(discountRec?.discount, subtotalCents);
    return Math.min(dc, subtotalCents);
  }, [discountRec, subtotalCents]);

  const taxableBaseCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = useMemo(() => calcTax(taxableBaseCents), [taxableBaseCents]);

  const shippingCents = 0;
  const totalCents = Math.max(0, taxableBaseCents + taxCents + shippingCents);

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
      setDiscountRec(null);
      setDiscountCode("");
      setDiscountStatus("");
    } catch (e) {
      setError(e?.message || "Could not clear cart.");
    } finally {
      setLoading(false);
    }
  }

  function goCheckout() {
    navigate("/checkout");
  }

  async function applyDiscountCode() {
    const code = String(discountCode || "").trim();
    if (!code) {
      setDiscountRec(null);
      setDiscountStatus("");
      return;
    }

    setDiscountLoading(true);
    setDiscountStatus("");
    try {
      const safe = code.replace(/"/g, '\\"');
      const rec = await pb
        .collection("discount")
        .getFirstListItem(`code="${safe}"`, { requestKey: null });

      setDiscountRec(rec);

      const dc = discountToCents(rec?.discount, subtotalCents);
      setDiscountStatus(
        dc > 0
          ? `Discount applied (${formatUSD(dc / 100)}).`
          : "Code found, but discount value is 0.",
      );
    } catch {
      setDiscountRec(null);
      setDiscountStatus("Invalid discount code.");
    } finally {
      setDiscountLoading(false);
    }
  }

  function generateOrderNumber() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rnd = Math.random().toString(16).slice(2, 6).toUpperCase();
    return `ORD-${y}${m}${day}-${rnd}`;
  }

  async function purchase() {
    // TODO: integrate Stripe/etc.
    return { ok: true };
  }

  async function buyNow() {
    if (!pb.authStore.isValid || !pb.authStore.model) {
      navigate("/login/signin");
      return;
    }
    if (!cart || tests.length === 0) return;

    setLoading(true);
    setError("");
    try {
      const result = await purchase();
      if (!result?.ok) throw new Error("Purchase failed.");
      const orderNumber = generateOrderNumber();
      const orderPayload = {
        tests: Array.isArray(cart.test)
          ? cart.test
          : cart.test
            ? [cart.test]
            : [],
        subtotal: subtotalCents / 100,
        tax: taxCents / 100, // ✅ NEW: store tax on order.tax
        total: totalCents / 100,
        user: pb.authStore.model.id,
        order_number: orderNumber,
        discount: discountRec?.id || null,
      };

      const created = await pb.collection("orders").create(orderPayload);

      await updateCartTests([]);
      setCart((prev) =>
        prev
          ? { ...prev, test: [], expand: { ...(prev.expand || {}), test: [] } }
          : prev,
      );

      setDiscountRec(null);
      setDiscountCode("");
      setDiscountStatus("Purchase complete.");
      setPurchaseSuccess({ orderNumber, orderId: created?.id || null });
      //onClose?.();
    } catch (e) {
      setError(e?.message || "Purchase failed.");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "orders" ? "Your orders" : "Your cart";

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
        } flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        {/* ✅ SUCCESS BANNER (shows inside drawer) */}
        {purchaseSuccess?.orderNumber && (
          <div className="px-4 pt-4 shrink-0">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 p-3">
              <div className="font-semibold">Purchase complete ✅</div>
              <div className="text-sm mt-1">
                Order number:{" "}
                <span className="font-mono font-semibold">
                  {purchaseSuccess.orderNumber}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-emerald-700 text-white px-3 py-2 text-sm hover:bg-emerald-800"
                  onClick={() => {
                    // If you have an orders route, go there:
                    // navigate(`/orders/${purchaseSuccess.orderId || ""}`);
                    // Otherwise just close:
                    onClose?.();
                  }}
                >
                  Done
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-emerald-300 px-3 py-2 text-sm hover:bg-emerald-100"
                  onClick={() => setPurchaseSuccess(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer: only for CART mode AND only when not showing success (optional) */}
        {mode === "cart" && !purchaseSuccess && (
          <div className="border-t border-slate-200 p-4 space-y-3 shrink-0 bg-white">
            {/* ...your existing totals + buttons... */}
            {/* Buy Now button should call buyNow() */}
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {mode === "orders" ? (
            <>
              {ordersLoading && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              )}

              {ordersErr && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-800 p-3 text-sm">
                  {ordersErr}
                </div>
              )}

              {!ordersLoading && orders.length === 0 && (
                <div className="text-slate-600">No orders yet.</div>
              )}

              <ul className="space-y-3">
                {orders.map((o) => {
                  const oTests = o?.expand?.tests ?? [];
                  const code = o?.expand?.discount?.discount;
                  return (
                    <li
                      key={o.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {o.order_number || "Order"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {o.created
                              ? new Date(o.created).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">
                            {formatUSD(o.total)}
                          </div>
                          {typeof o.tax !== "undefined" && (
                            <div className="text-xs text-slate-600">
                              Tax: {formatUSD(o.tax)}
                            </div>
                          )}
                        </div>
                      </div>

                      {code && (
                        <div className="mt-2 text-xs text-slate-600">
                          Discount: {formatUSD(o.subtotal / code)}
                        </div>
                      )}

                      {Array.isArray(oTests) && oTests.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-slate-700 mb-1">
                            Items ({oTests.length})
                          </div>
                          <ul className="space-y-1">
                            {oTests.map((t) => (
                              <li
                                key={t.id}
                                className="flex justify-between text-sm text-slate-700"
                              >
                                <span className="truncate pr-2">{t.name}</span>
                                <span className="text-slate-900">
                                  {formatUSD(t.cost)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
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

              <div className="h-3" />
            </>
          )}
        </div>

        {/* Footer: only for CART mode */}
        {mode === "cart" && (
          <div className="border-t border-slate-200 p-4 space-y-3 shrink-0 bg-white">
            <div className="flex justify-between text-sm text-slate-700">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">
                {displayFromCents(subtotalCents)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Discount code</span>
                <span className="font-medium text-slate-900">
                  {discountCents > 0
                    ? `- ${displayFromCents(discountCents)}`
                    : displayFromCents(0)}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter code"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  disabled={loading}
                  autoCapitalize="characters"
                />
                <button
                  type="button"
                  onClick={applyDiscountCode}
                  disabled={loading || discountLoading}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                  title="Apply"
                >
                  {discountLoading ? "…" : "Apply"}
                </button>
              </div>

              {discountStatus && (
                <div className="text-xs text-slate-600">{discountStatus}</div>
              )}
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

            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                onClick={clearCart}
                disabled={tests.length === 0 || loading}
                className="rounded-xl border border-slate-300 px-3 py-2 hover:bg-slate-50 disabled:opacity-60"
              >
                Clear
              </button>

              {/* <button
                onClick={goCheckout}
                disabled={tests.length === 0 || loading}
                className="rounded-xl bg-sky-600 text-white px-3 py-2 hover:bg-sky-700 disabled:opacity-60"
              >
                Checkout
              </button> */}

              <button
                onClick={buyNow}
                disabled={tests.length === 0 || loading}
                className="rounded-xl bg-sky-600 text-white px-3 py-2 hover:bg-sky-700 disabled:opacity-60"
              >
                {loading ? "Processing…" : "Buy Now"}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
