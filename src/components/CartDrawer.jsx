function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");

  // Discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discountRec, setDiscountRec] = useState(null);
  const [discountStatus, setDiscountStatus] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

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

        const c = await findOpenCart(true, ac.signal);
        setCart(c);

        // reset discount UI each open
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
  }, [open, navigate]);

  const tests = cart?.expand?.test ?? [];

  const subtotalCents = useMemo(
    () => tests.reduce((sum, t) => sum + cents(t.cost), 0),
    [tests],
  );

  // tax function (receives subtotal cents, returns cents)
  function calcTax(subtotalCentsLike) {
    const rate = 0; // TODO set your tax rate, e.g. 0.0825
    return Math.round((subtotalCentsLike || 0) * rate);
  }

  function discountToCents(discountValue, subCents) {
    const v = Number(discountValue);
    if (!Number.isFinite(v) || v <= 0) return 0;

    // fraction: percent
    if (v > 0 && v <= 1) return Math.round((subCents || 0) * v);

    // 1-100: percent
    if (v > 1 && v <= 100) return Math.round((subCents || 0) * (v / 100));

    // >100: dollars off
    return cents(v);
  }

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

      const orderPayload = {
        tests: Array.isArray(cart.test)
          ? cart.test
          : cart.test
            ? [cart.test]
            : [],
        subtotal: subtotalCents / 100,
        total: totalCents / 100,
        user: pb.authStore.model.id,
        order_number: generateOrderNumber(),
        discount: discountRec?.id || null,
      };

      await pb.collection("orders").create(orderPayload);

      await updateCartTests([]);
      setCart((prev) =>
        prev
          ? {
              ...prev,
              test: [],
              expand: { ...(prev.expand || {}), test: [] },
            }
          : prev,
      );

      setDiscountRec(null);
      setDiscountCode("");
      setDiscountStatus("Purchase complete.");
      onClose?.();
    } catch (e) {
      setError(e?.message || "Purchase failed.");
    } finally {
      setLoading(false);
    }
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
        } flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
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

          {/* padding so last list item doesn't sit under footer */}
          <div className="h-3" />
        </div>

        {/* ✅ Totals / Footer (ALWAYS visible) */}
        <div className="border-t border-slate-200 p-4 space-y-3 shrink-0 bg-white">
          <div className="flex justify-between text-sm text-slate-700">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">
              {displayFromCents(subtotalCents)}
            </span>
          </div>

          {/* Discount code */}
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
                placeholder="Enter codeeeeee"
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
            <span>Tax111</span>
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

            <button
              onClick={goCheckout}
              disabled={tests.length === 0 || loading}
              className="rounded-xl bg-sky-600 text-white px-3 py-2 hover:bg-sky-700 disabled:opacity-60"
            >
              Checkout
            </button>

            <button
              onClick={buyNow}
              disabled={tests.length === 0 || loading}
              className="rounded-xl bg-black text-white px-3 py-2 hover:bg-black/90 disabled:opacity-60"
            >
              {loading ? "Processing…" : "Buy Now"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
