import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogIn,
  UserPlus,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import pb from "@/db/pocketbase";
import PlacesAddressInput from "@/components/PlacesAddressInput";

/**
 * AuthPage.jsx (API SERVER VERSION)
 * - Uses Express API server for auth + cart count
 * - Saves returned PB token/model into pb.authStore so the rest of the app keeps working
 *
 * Required env:
 * - VITE_PUBLIC_API_BASE (e.g. http://localhost:8080)
 */

const API_URL = String(import.meta.env.VITE_PUBLIC_API_BASE || "").replace(
  /\/+$/,
  ""
);

function classNames(...c) {
  return c.filter(Boolean).join(" ");
}

async function apiFetch(path, { method = "GET", body, token } = {}) {
  if (!API_URL) throw new Error("Missing VITE_PUBLIC_API_BASE");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // try to parse JSON error payloads cleanly
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      json?.error || json?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json ?? {};
}

async function fetchOpenCartCountViaApi() {
  try {
    const token = pb.authStore?.token;
    if (!token) return 0;

    const res = await apiFetch("/api/cart/open-count", { token });
    return Number(res?.count || 0) || 0;
  } catch {
    return 0;
  }
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");

  // shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup-only fields
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [addressObj, setAddressObj] = useState(null);

  const loggedIn = pb.authStore.isValid && !!pb.authStore.model;

  const displayName = useMemo(() => {
    const u = pb.authStore.model || {};
    return u.name || u.username || u.email || "Account";
  }, [loggedIn]);

  useEffect(() => {
    (async () => {
      if (!loggedIn) return;
      const c = await fetchOpenCartCountViaApi();
      setCartCount(c);
    })();
  }, [loggedIn]);

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      // API server signs in against PB and returns { token, record }
      const res = await apiFetch("/api/auth/signin", {
        method: "POST",
        body: { email: email.trim(), password },
      });

      const token = res?.token;
      const record = res?.record;

      if (!token || !record?.id) {
        throw new Error("Invalid auth response from server.");
      }

      // ✅ Keep PocketBase client in sync for the rest of your app
      pb.authStore.save(token, record);

      // optional: cart count (don’t block redirect)
      const after = fetchOpenCartCountViaApi()
        .then(setCartCount)
        .catch(() => {});

      navigate("/tests", { replace: true });
      await after;
    } catch (err) {
      setError(err?.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      // API server creates PB user and returns { token, record }
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
          fname: fname.trim(),
          lname: lname.trim(),
          phone: phone.trim(),
          address: addressObj || null,
        },
      });

      const token = res?.token;
      const record = res?.record;

      if (!token || !record?.id) {
        throw new Error("Invalid signup response from server.");
      }

      pb.authStore.save(token, record);

      const after = fetchOpenCartCountViaApi()
        .then(setCartCount)
        .catch(() => {});

      navigate("/tests", { replace: true });
      await after;
    } catch (err) {
      setError(err?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[70vh] bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sky-900">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <div className="flex items-center gap-2 text-slate-600">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm">
              Cart:{" "}
              <span className="font-semibold text-slate-900">{cartCount}</span>{" "}
              test{cartCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
          <button
            onClick={() => setMode("signin")}
            className={classNames(
              "px-4 py-2 rounded-lg text-sm flex items-center gap-2",
              mode === "signin"
                ? "bg-white border border-slate-200"
                : "hover:bg-white/60"
            )}
          >
            <LogIn className="w-4 h-4" /> Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={classNames(
              "px-4 py-2 rounded-lg text-sm flex items-center gap-2",
              mode === "signup"
                ? "bg-white border border-slate-200"
                : "hover:bg-white/60"
            )}
          >
            <UserPlus className="w-4 h-4" /> Create account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <div className="text-sm">{successMsg}</div>
          </div>
        )}

        {/* Forms */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="p-6 grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <button
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2.5 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}{" "}
                Sign in
              </button>
              {loggedIn && (
                <div className="text-sm text-slate-600">
                  Signed in as{" "}
                  <span className="font-medium text-slate-900">
                    {displayName}
                  </span>
                  .
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="p-6 grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <input
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <input
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Address
                </label>
                <PlacesAddressInput
                  value={addressObj}
                  onChange={setAddressObj}
                  restrictCountry="us"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Powered by Google Places.
                </p>
              </div>

              <button
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2.5 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}{" "}
                Create account
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-sm text-slate-600">
          <Link to="/tests" className="text-sky-700 hover:underline">
            Browse tests
          </Link>
        </div>
      </div>
    </section>
  );
}
