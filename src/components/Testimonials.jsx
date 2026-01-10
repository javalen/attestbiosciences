import { useEffect, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaQuoteLeft,
  FaQuoteRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import pb from "@/db/pocketbase";

/* -------------------- Data server helper (fetch) -------------------- */
const DATA_SERVER_BASE = import.meta.env.VITE_PUBLIC_API_BASE?.replace(
  /\/+$/,
  ""
);

function isAbortError(err) {
  const name = err?.name || "";
  const msg = String(err?.message || "");
  return (
    name === "AbortError" ||
    msg.toLowerCase().includes("signal is aborted") ||
    msg.toLowerCase().includes("aborted")
  );
}

async function apiFetch(path, { method = "GET", body, signal, headers } = {}) {
  if (!DATA_SERVER_BASE) {
    throw new Error(
      "Missing DATA SERVER base URL. Set VITE_DATA_SERVER_URL (or VITE_API_URL)."
    );
  }

  const h = { ...(headers || {}) };

  if (body && !(body instanceof FormData)) {
    h["Content-Type"] = "application/json";
  }

  if (pb?.authStore?.isValid && pb?.authStore?.token) {
    h.Authorization = `Bearer ${pb.authStore.token}`;
  }

  const res = await fetch(`${DATA_SERVER_BASE}${path}`, {
    method,
    headers: h,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ---------------------------- UI helpers ---------------------------- */
function clampRating(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    let alive = true; // protects against setState after unmount

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const data = await apiFetch("/testimonials?limit=50", {
          signal: ac.signal,
        });

        if (!alive) return;

        const rows = (data?.items || []).map((r) => ({
          id: r.id,
          name: r.name || "Anonymous",
          role: r.role || "Patient",
          content: r.content || "",
          rating: clampRating(r.rating),
          image: r.image || `https://i.pravatar.cc/160?u=${r.id || "anon"}`,
        }));

        setItems(rows);
        setCurrentIndex(0);
      } catch (e) {
        if (!alive) return;
        if (isAbortError(e)) return; // ✅ ignore abort noise
        setErr(e?.message || "Failed to load testimonials.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ac.abort(); // ✅ cancels fetch on unmount / StrictMode re-run
    };
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((i) => (items.length ? (i + 1) % items.length : 0));
  };

  const prevTestimonial = () => {
    setCurrentIndex((i) =>
      items.length ? (i - 1 + items.length) % items.length : 0
    );
  };

  return (
    <div
      id="testimonials"
      className="scroll-mt-20 relative py-16 bg-gradient-to-r from-blue-50 to-sky-50 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-sky-300"></div>
        <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-300"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-sky-800 sm:text-4xl">
            Attest BioSciences Client Testimonials
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            We take pride in our patients' satisfaction and always strive to
            provide the best and most modern testing available.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10 text-slate-600">
            Loading testimonials…
          </div>
        )}

        {!loading && err && (
          <div className="max-w-xl mx-auto mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {err}
          </div>
        )}

        {!loading && !err && items.length === 0 && (
          <div className="flex justify-center items-center py-10 text-slate-600">
            No testimonials yet.
          </div>
        )}

        {!loading && !err && items.length > 0 && (
          <div className="relative">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {items.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center">
                    <div className="md:w-1/3 mb-8 md:mb-0 flex justify-center">
                      <div className="relative">
                        <img
                          className="w-40 h-40 rounded-full object-cover border-4 border-sky-100 shadow-lg"
                          src={testimonial.image}
                          alt={testimonial.name}
                        />
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-sky-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>

                    <div className="md:w-2/3 md:pl-12">
                      <div className="relative px-6 md:px-10">
                        <FaQuoteLeft className="text-sky-200 text-2xl md:text-3xl absolute -top-3 left-0" />
                        <p className="text-lg text-gray-700 mb-6 relative z-10 text-justify">
                          {testimonial.content}
                        </p>
                        <FaQuoteRight className="text-sky-200 text-2xl md:text-3xl absolute -bottom-3 right-0" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-sky-800">
                            {testimonial.name}
                          </h3>
                          <div className="flex mt-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`text-lg ${
                                  i < testimonial.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="hidden md:flex space-x-2">
                          <button
                            onClick={prevTestimonial}
                            className="p-2 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 transition-colors"
                          >
                            <FaChevronLeft />
                          </button>
                          <button
                            onClick={nextTestimonial}
                            className="p-2 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 transition-colors"
                          >
                            <FaChevronRight />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 space-x-4 md:hidden">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full ${
                    currentIndex === index ? "bg-sky-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            to="/testimonials/new"
            className="px-8 py-3 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-700 transition-colors duration-300 shadow-lg hover:shadow-xl inline-block"
          >
            Share Your Experience
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
