// AuthPage.jsx (DROP-IN) — match "Account sign in" screenshot styling
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import pb from "@/db/pocketbase";
import PlacesAddressInput from "@/components/PlacesAddressInput";
import { useParams } from "react-router-dom";

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
  "",
);

async function apiFetch(path, { method = "GET", body, token } = {}) {
  if (!API_URL) throw new Error("Missing VITE_PUBLIC_API_BASE");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

export default function AuthPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup-only
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [addressObj, setAddressObj] = useState(null);

  const loggedIn = pb.authStore.isValid && !!pb.authStore.model;

  const displayName = useMemo(() => {
    const u = pb.authStore.model || {};
    return u.name || u.username || u.email || "Account";
  }, [loggedIn]);

  const { mode: routeMode } = useParams();
  const [mode, setMode] = useState(
    routeMode === "signup" ? "signup" : "signin",
  );

  useEffect(() => {
    if (routeMode === "signup") setMode("signup");
    else setMode("signin");
  }, [routeMode]);

  useEffect(() => {
    // optional: if already logged in, you can redirect or keep as-is
  }, [loggedIn]);

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/signin", {
        method: "POST",
        body: { email: email.trim(), password },
      });

      const token = res?.token;
      const record = res?.record;

      if (!token || !record?.id) throw new Error("Invalid auth response.");

      pb.authStore.save(token, record);

      navigate("/tests", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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

      if (!token || !record?.id) throw new Error("Invalid signup response.");

      pb.authStore.save(token, record);

      navigate("/tests", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  // underline input style (matches screenshot)
  const inputBase =
    "w-full bg-transparent outline-none text-[16px] text-slate-900 placeholder:text-slate-400";
  const underlineWrap = "border-b border-slate-400/90 py-2";
  const labelText = "text-[15px] text-slate-800";

  return (
    <section className="bg-white">
      {/* generous whitespace + centered like screenshot */}
      <div className="mx-auto min-h-[76vh] max-w-[840px] px-6 pt-[96px] pb-[120px] flex flex-col items-center">
        <h1 className="text-[13px] tracking-[0.28em] font-semibold text-slate-900 uppercase">
          {mode === "signin" ? "Account sign in" : "Create account"}
        </h1>

        <div className="mt-[44px] w-full max-w-[680px] text-center">
          <p className="mx-auto max-w-[560px] text-[15px] leading-[1.7] text-slate-700">
            {mode === "signin"
              ? "Sign in to your account to access your profile, history, and any private pages you've been granted access to."
              : "Create your account to save orders, view your history, and access any private pages you've been granted access to."}
          </p>
        </div>

        {/* error */}
        {error && (
          <div className="mt-6 w-full max-w-[680px] text-center">
            <p className="text-[14px] text-red-700">{error}</p>
          </div>
        )}

        {/* form */}
        <div className="mt-[34px] w-full max-w-[680px]">
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-[34px]">
              <div className="space-y-2">
                <div className={labelText}>Email</div>
                <div className={underlineWrap}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className={labelText}>Password</div>
                <div className={underlineWrap}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col items-center">
                <button
                  disabled={loading}
                  className="
                    inline-flex items-center justify-center
                    h-[46px] px-10
                    border-2 border-black
                    rounded-full
                    text-[12px] font-semibold uppercase
                    tracking-[0.26em]
                    hover:bg-black hover:text-white
                    transition-colors duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // optional: wire to your reset flow later
                    // navigate("/reset-password");
                  }}
                  className="mt-5 text-[14px] text-slate-600 hover:text-slate-900"
                >
                  Reset password
                </button>

                <div className="mt-10 text-[15px] text-slate-700">
                  Not a member?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-slate-800 underline underline-offset-4 hover:text-black"
                  >
                    Create account.
                  </button>
                </div>

                {loggedIn && (
                  <div className="mt-6 text-[13px] text-slate-500">
                    Signed in as{" "}
                    <span className="text-slate-700">{displayName}</span>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-[28px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className={labelText}>First name</div>
                  <div className={underlineWrap}>
                    <input
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      required
                      className={inputBase}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={labelText}>Last name</div>
                  <div className={underlineWrap}>
                    <input
                      value={lname}
                      onChange={(e) => setLname(e.target.value)}
                      required
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className={labelText}>Phone</div>
                <div className={underlineWrap}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className={labelText}>Email</div>
                <div className={underlineWrap}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className={labelText}>Password</div>
                <div className={underlineWrap}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputBase}
                  />
                </div>
                <p className="text-[12px] text-slate-500 mt-2">
                  Must be at least 8 characters.
                </p>
              </div>

              <div className="space-y-2">
                <div className={labelText}>Address</div>
                <div className="pt-1">
                  <PlacesAddressInput
                    value={addressObj}
                    onChange={setAddressObj}
                    restrictCountry="us"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col items-center">
                <button
                  disabled={loading}
                  className="
                    inline-flex items-center justify-center
                    h-[46px] px-10
                    border-2 border-black
                    rounded-full
                    text-[12px] font-semibold uppercase
                    tracking-[0.26em]
                    hover:bg-black hover:text-white
                    transition-colors duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Create account
                </button>

                <div className="mt-10 text-[15px] text-slate-700">
                  Already a member?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-slate-800 underline underline-offset-4 hover:text-black"
                  >
                    Sign in.
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* optional footer link (kept subtle) */}
        <div className="mt-10 text-[13px] text-slate-500">
          <Link to="/tests" className="hover:text-slate-800">
            Browse tests
          </Link>
        </div>
      </div>
    </section>
  );
}
