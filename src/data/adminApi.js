// /src/data/adminApi.js (DROP-IN)
import pb from "@/db/pocketbase";

const ORIGIN = window.location.origin;
const BASE = String(import.meta.env.BASE_URL || "/").replace(/\/+$/, ""); // "/attestbiosciences" or ""
const API_ROOT =
  String(import.meta.env.VITE_PUBLIC_API_BASE || "").replace(/\/+$/, "") ||
  `${ORIGIN}${BASE}`; // e.g. http://localhost:5173/attestbiosciences

function isFormData(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function apiFetch(path, { method = "GET", body, token } = {}) {
  if (!API_ROOT) {
    throw new Error("Missing API base. Set VITE_PUBLIC_API_BASE or Vite base.");
  }

  const headers = {};
  const form = isFormData(body);

  // Only set JSON headers if NOT FormData
  if (!form) headers["Content-Type"] = "application/json";

  const t = token || pb.authStore?.token;
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API_ROOT}${path}`, {
    method,
    headers,
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore non-json
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

/* ---------------- Admin helpers (match server.js) ---------------- */

export const adminMe = () => apiFetch("/api/admin/me");

export const adminList = (collection, params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v);
    if (!s) return;
    qs.set(k, s);
  });

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/admin/${collection}${suffix}`);
};

// ✅ FIX: server.js defines /api/admin/options/:collection
export const adminOptions = (collection, params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v);
    if (!s) return;
    qs.set(k, s);
  });

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/admin/options/${collection}${suffix}`);
};

// ✅ If FormData is passed for team_members, use multipart endpoints
export const adminCreate = (collection, body) => {
  if (collection === "team_members" && isFormData(body)) {
    return apiFetch(`/api/admin/team_members/multipart`, {
      method: "POST",
      body,
    });
  }
  return apiFetch(`/api/admin/${collection}`, { method: "POST", body });
};

export const adminUpdate = (collection, id, body) => {
  if (collection === "team_members" && isFormData(body)) {
    return apiFetch(`/api/admin/team_members/${id}/multipart`, {
      method: "PATCH",
      body,
    });
  }
  return apiFetch(`/api/admin/${collection}/${id}`, { method: "PATCH", body });
};

export const adminDelete = (collection, id) =>
  apiFetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
