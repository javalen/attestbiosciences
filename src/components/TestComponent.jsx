import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import PocketBase from "pocketbase";
import {
  ArrowRight,
  ChevronLeft,
  FlaskConical,
  Info,
  ChevronDown,
} from "lucide-react";
import pb from "@/db/pocketbase";

/**
 * Configure your PocketBase URL here (or via Vite env: VITE_PB_URL)
 * Example for Fly.io: https://<your-app>.fly.dev
 */
const PB_URL = import.meta.env.VITE_PB_URL || "http://localhost:8090";

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

/**
 * List page grouped by Category (relation `cat_id`)
 */
export function TestsIndex() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Pull tests with expanded category relation
        const res = await pb.collection("test").getList(1, 500, {
          sort: "+name",
          expand: "cat_id",
        });
        if (!cancelled) setTests(res?.items ?? []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load tests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q) return tests;
    const term = q.toLowerCase();
    return tests.filter((t) =>
      [t.name, t.description, getCatName(t), t.cost]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [q, tests]);

  const grouped = useMemo(() => {
    const byId = new Map();
    for (const t of filtered) {
      const cat = getCat(t);
      const key = cat?.id || "__uncat";
      if (!byId.has(key))
        byId.set(key, {
          id: key,
          name: cat?.name || "Uncategorized",
          items: [],
        });
      byId.get(key).items.push(t);
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [filtered]);

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-white">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="flex items-center gap-3 text-sky-700">
            <FlaskConical className="w-6 h-6 animate-pulse" />
            <p className="text-lg">Loading available tests…</p>
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
              <h2 className="text-xl font-semibold">Couldn’t load tests</h2>
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
              Available Tests
            </h1>
            <p className="text-slate-600">
              Browse our catalog by category. Tap any card for details.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tests or categories…"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
        </div>

        {/* Grouped by Category */}
        {grouped.length === 0 ? (
          <div className="mt-12 text-slate-600">
            No tests match your search.
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {grouped.map((group) => (
              <section
                key={group.id}
                id={`cat-${group.id}`}
                className="scroll-mt-24"
              >
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  {group.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((t) => (
                    <TestCard key={t.id} test={t} showCategory={false} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
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
      className={`group text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-sky-300 ${
        available ? "" : "opacity-90"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {test.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {showCategory && (
              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {catName}
              </span>
            )}
            {!available && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Unavailable
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
        <span className="inline-flex items-center gap-1 text-sky-700 group-hover:gap-2 transition-all">
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

/**
 * Detail page: shows a single test by ID with expanded category
 */
export function TestDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rec = await pb
          .collection("test")
          .getOne(id, { expand: "cat_id" });
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
                    Unavailable
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
              {hasText(item.more_info) && (
                <InfoAccordionSection title="More info" text={item.more_info} />
              )}
              {hasText(item.measured) && (
                <InfoAccordionSection
                  title="What's measured"
                  text={item.measured}
                />
              )}
              {hasText(item.who_should) && (
                <InfoAccordionSection
                  title="Who should take this test"
                  text={item.who_should}
                />
              )}
            </div>
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
            <div className="mt-6 grid gap-3">
              <button
                disabled={!available}
                className={`inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-300 ${
                  available
                    ? "bg-sky-600 hover:bg-sky-700"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                {available ? (
                  <>
                    Order this test <ArrowRight className="w-4 h-4" />
                  </>
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
