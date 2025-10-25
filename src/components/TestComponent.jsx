import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import PocketBase from "pocketbase";
import {
  ArrowRight,
  ChevronLeft,
  FlaskConical,
  Info,
  ChevronDown,
  Loader2,
  XCircle,
} from "lucide-react";
import pb from "@/db/pocketbase";

/** Utils **/
const formatUSD = (val) => {
  const n = Number.parseFloat(val ?? "0");
  if (Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n}`;
  }
};

const truncate = (text, n = 120) =>
  text && text.length > n ? text.slice(0, n - 1) + "…" : text || "";

const getCat = (rec, key = "cat_id") => {
  const x = rec?.expand?.[key];
  if (Array.isArray(x)) return x[0] || null; // support M2M by taking first
  return x || null; // single relation
};

const getCatName = (rec) => getCat(rec)?.name || "Uncategorized";

const isAvailable = (rec) => rec?.available !== false; // default to available if field missing

async function fetchAllCategories() {
  try {
    return await pb.collection("test_category").getFullList({ sort: "+name" });
  } catch (e1) {
    console.log("Error", e1);
  }
}

// Get a category id from a test record (supports single or M2M)
function getCatIdFromTest(t, key = "cat_id") {
  const raw = t?.[key];
  if (Array.isArray(raw)) return raw[0] || null;
  if (typeof raw === "string" && raw) return raw;

  const exp = t?.expand?.[key];
  if (Array.isArray(exp)) return exp[0]?.id || null;
  return exp?.id || null;
}

/**
 * List page grouped by Category (relation `cat_id`)
 */
export function TestsIndex() {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]); // all cats from PB
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const [cats, testsRes] = await Promise.all([
          fetchAllCategories(),
          pb.collection("test").getList(1, 500, {
            filter: "top_level_test=true",
            sort: "+name",
            expand: "cat_id, included_test",
          }),
        ]);

        console.log("Test", testsRes);
        if (cancelled) return;
        setCategories(cats || []);
        setTests(testsRes?.items ?? []);
      } catch (e) {
        if (!cancelled)
          setError(e?.message || "Failed to load categories/tests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter tests by search
  const filteredTests = useMemo(() => {
    if (!q) return tests;
    const term = q.toLowerCase();
    return tests.filter((t) =>
      [t.name, t.description, getCatName(t), t.cost]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [q, tests]);

  // Map tests by category id (including null → uncategorized)
  const testsByCat = useMemo(() => {
    const m = new Map();
    for (const t of filteredTests) {
      const cid = getCatIdFromTest(t) || "__uncat";
      if (!m.has(cid)) m.set(cid, []);
      m.get(cid).push(t);
    }
    return m;
  }, [filteredTests]);

  const uncategorized = testsByCat.get("__uncat") || [];

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-white">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="flex items-center gap-3 text-sky-700">
            <FlaskConical className="w-6 h-6 animate-pulse" />
            <p className="text-lg">Loading categories & tests…</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl border border-slate-200 shadow-sm bg-slate-50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[50vh] bg-white">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="flex items-start gap-3 text-red-700">
            <Info className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold">Couldn’t load data</h2>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-sky-900">
              Tests by Category
            </h1>
            <p className="text-slate-600">
              Expand a category to view its tests.
            </p>
          </div>

          {/* Search with clear (red X) */}
          <div className="w-full sm:w-80 relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tests or categories…"
              className="w-full rounded-xl border border-slate-300 pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            {q?.length > 0 && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                title="Clear"
              >
                <XCircle className="w-5 h-5 text-red-500 hover:text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* Categories accordions */}
        <div className="mt-8 space-y-4">
          {categories.map((cat) => {
            const catTests = testsByCat.get(cat.id) || [];
            const noneMsg = q
              ? "No tests match your search in this category."
              : "No tests are available in this category yet.";
            return (
              <details
                key={cat.id}
                className="group border border-slate-200 rounded-xl bg-white shadow-sm"
              >
                <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base sm:text-lg font-semibold text-slate-900">
                      {cat.name}
                    </span>
                    <span className="text-xs sm:text-sm px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {catTests.length}{" "}
                      {catTests.length === 1 ? "test" : "tests"}
                    </span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>

                <div className="px-4 pb-4">
                  {catTests.length === 0 ? (
                    <div className="text-slate-600">{noneMsg}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catTests.map((t) => (
                        <TestCard key={t.id} test={t} showCategory={false} />
                      ))}
                    </div>
                  )}
                </div>
              </details>
            );
          })}

          {uncategorized.length > 0 && (
            <details className="group border border-slate-200 rounded-xl bg-white shadow-sm">
              <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-semibold text-slate-900">
                    Uncategorized
                  </span>
                  <span className="text-xs sm:text-sm px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {uncategorized.length}{" "}
                    {uncategorized.length === 1 ? "test" : "tests"}
                  </span>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>

              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uncategorized.map((t) => (
                    <TestCard key={t.id} test={t} showCategory={false} />
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function TestCard({ test, showCategory = true }) {
  const navigate = useNavigate();
  const catName = getCatName(test);
  const available = isAvailable(test);

  return (
    <button
      onClick={() => navigate(`/tests/${test.id}`)}
      className={`group text-left rounded-2xl border border-slate-200 bg-white shadow-sm
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400
        hover:-translate-y-0.5 hover:shadow-lg hover:border-sky-300 hover:bg-sky-50
        ${available ? "" : "opacity-90"}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl bg-sky-50 text-sky-700 transition-colors
                            group-hover:bg-sky-100 group-hover:text-sky-800"
            >
              <FlaskConical className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-sky-900">
              {test.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {showCategory && (
              <span
                className="text-sm font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700
                               transition-colors group-hover:bg-sky-100 group-hover:text-sky-800"
              >
                {catName}
              </span>
            )}
            {!available && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Coming Soon
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-slate-600 min-h-[3rem]">
          {truncate(test.description)}
        </p>
        {!available && (
          <p className="mt-2 text-sm text-amber-800">
            This test is currently unavailable. Please check back soon.
          </p>
        )}
      </div>

      <div className="px-5 pb-5 flex items-center justify-between">
        <span className="text-sky-900 font-bold">{formatUSD(test.cost)}</span>
        <span
          className="inline-flex items-center gap-1 text-sky-700 transition-all
                         group-hover:gap-2 group-hover:text-sky-800"
        >
          View details <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </button>
  );
}

function hasText(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function InfoAccordionSection({ title, text }) {
  return (
    <details className="group border border-slate-200 rounded-xl">
      <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-4 py-3">
        <span className="font-medium text-slate-900">{title}</span>
        <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-slate-700 whitespace-pre-wrap">{text}</div>
    </details>
  );
}

async function getOrCreateOpenCart(userId) {
  try {
    return await pb
      .collection("cart")
      .getFirstListItem(`user = "${userId}" && status = "open"`);
  } catch (err) {
    if (err?.status === 404 || /not found/i.test(err?.message || "")) {
      return await pb.collection("cart").create({
        user: userId,
        status: "open",
        last_activity_at: new Date().toISOString(),
      });
    }
    throw err;
  }
}

async function addTestToCart(userId, testId) {
  const cart = await getOrCreateOpenCart(userId);
  const current = Array.isArray(cart.test)
    ? cart.test.slice()
    : cart.test
    ? [cart.test]
    : [];

  if (current.includes(testId)) {
    return { cartId: cart.id, already: true };
  }

  const updated = await pb.collection("cart").update(cart.id, {
    test: [...current, testId],
    last_activity_at: new Date().toISOString(),
  });

  return { cartId: updated.id, already: false };
}

/**
 * Detail page: shows a single test by ID with expanded category + included tests
 */
export function TestDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [addErr, setAddErr] = useState("");
  const navigate = useNavigate();

  async function handleAddToCart() {
    setAddMsg("");
    setAddErr("");
    if (!pb.authStore.isValid || !pb.authStore.model) {
      return navigate("/login", { state: { redirectTo: `/tests/${id}` } });
    }
    try {
      setAdding(true);
      const { already } = await addTestToCart(pb.authStore.model.id, item.id);
      setAddMsg(already ? "Already in your cart." : "Added to your cart.");
    } catch (e) {
      setAddErr(e?.message || "Could not add to cart.");
    } finally {
      setAdding(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rec = await pb.collection("test").getOne(id, {
          expand: "cat_id, included_test",
        });
        if (!cancelled) setItem(rec);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="min-h-[60vh] bg-white">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="h-8 w-40 rounded bg-slate-100 animate-pulse" />
          <div className="mt-6 h-32 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse" />
        </div>
      </section>
    );
  }

  if (error || !item) {
    return (
      <section className="min-h-[50vh] bg-white">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <Link
            to="/tests"
            className="inline-flex items-center gap-2 text-sky-700 mb-6"
          >
            <ChevronLeft className="w-5 h-5" /> Back to tests
          </Link>
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-800">
            {error || "Test not found"}
          </div>
        </div>
      </section>
    );
  }

  const catName = getCatName(item);
  const available = isAvailable(item);
  const includedTests = Array.isArray(item?.expand?.included_test)
    ? item.expand.included_test
    : [];

  return (
    <section className="min-h-[60vh] bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <Link
          to="/tests"
          className="inline-flex items-center gap-2 text-sky-700"
        >
          <ChevronLeft className="w-5 h-5" /> Back to tests
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {item.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start">
                  {catName}
                </span>
                {!available && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>

            {!available && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                This test is currently unavailable. Please check back soon or
                contact support to be notified when it returns.
              </div>
            )}

            <p className="mt-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
              {item.description || "No description provided."}
            </p>

            <div className="mt-6 grid gap-3">
              {hasText(item.description_long) && (
                <InfoAccordionSection
                  title="More info..."
                  text={item.description_long}
                />
              )}
              {hasText(item.measured) && (
                <InfoAccordionSection
                  title="What's measured?"
                  text={item.measured}
                />
              )}
              {hasText(item.who) && (
                <InfoAccordionSection
                  title="Who should take this test?"
                  text={item.who}
                />
              )}
              {hasText(item.frequency) && (
                <InfoAccordionSection
                  title="How often should I take this test?"
                  text={item.frequency}
                />
              )}
            </div>

            {/* Included/child tests */}
            {includedTests.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">
                  Included tests
                </h2>
                <p className="text-slate-600 mt-1">
                  These tests are bundled within{" "}
                  <span className="font-medium">{item.name}</span>.
                </p>

                <div className="mt-4 grid gap-4">
                  {includedTests.map((child) => (
                    <div
                      key={child.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                          <FlaskConical className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {child.name}
                        </h3>
                      </div>

                      <p className="mt-3 text-slate-700 whitespace-pre-wrap">
                        {child.description || "No description provided."}
                      </p>

                      {hasText(child.description_long) && (
                        <div className="mt-3">
                          <InfoAccordionSection
                            title="More info..."
                            text={child.description_long}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm h-max">
            <div className="text-sm text-slate-500">Price</div>
            <div className="text-3xl font-extrabold text-sky-900">
              {formatUSD(item.cost)}
            </div>
            {!available && (
              <div className="mt-3 text-sm text-amber-800">
                Currently unavailable.
              </div>
            )}
            {addMsg && (
              <div className="mt-3 text-sm text-emerald-700">{addMsg}</div>
            )}
            {addErr && (
              <div className="mt-3 text-sm text-red-700">{addErr}</div>
            )}

            <div className="mt-6 grid gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!available || adding}
                className={`inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-300 ${
                  available && !adding
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                {available ? (
                  adding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    <>
                      Order this test <ArrowRight className="w-4 h-4" />
                    </>
                  )
                ) : (
                  <>Order unavailable</>
                )}
              </button>
              <a
                href="#services"
                className="inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 border border-slate-300 hover:bg-slate-50"
              >
                Explore services
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/**
 * Drop-in feature routes. Mount this inside your existing <Router>.
 */
export default function TestsFeature() {
  return (
    <Routes>
      <Route path="/tests" element={<TestsIndex />} />
      <Route path="/tests/:id" element={<TestDetail />} />
    </Routes>
  );
}
