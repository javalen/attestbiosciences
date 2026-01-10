import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, MailPlus } from "lucide-react";

/**
 * WaitList.jsx (MAILING LIST VERSION)
 * - POSTs to API server which writes to PB collection: `mailing_list`
 *
 * Required env:
 * - VITE_PUBLIC_API_BASE (e.g. http://localhost:8080)
 */

const API_URL = String(import.meta.env.VITE_PUBLIC_API_BASE || "").replace(
  /\/+$/,
  ""
);

async function apiFetch(path, { method = "GET", body } = {}) {
  if (!API_URL) throw new Error("Missing VITE_PUBLIC_API_BASE");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
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

export default function WaitList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const payload = {
        fname: fname.trim(),
        lname: lname.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
      };

      await apiFetch("/api/mailing-list/join", {
        method: "POST",
        body: payload,
      });

      setSuccessMsg("You're on the list! 🎉");
      setFname("");
      setLname("");
      setPhone("");
      setEmail("");
    } catch (err) {
      setError(err?.message || "Failed to join the mailing list.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[70vh] bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sky-900">
            Join our wait list
          </h1>
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

        {/* Form */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 grid gap-4">
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
                placeholder="Optional"
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

            <button
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2.5 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MailPlus className="w-4 h-4" />
              )}
              Count Me In..
            </button>

            <div className="text-xs text-slate-500">
              We’ll only email you important updates. No spam.
            </div>
          </form>
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
