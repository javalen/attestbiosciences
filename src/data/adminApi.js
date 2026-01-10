import pb from "@/db/pocketbase";

const API_BASE = (import.meta.env.VITE_PUBLIC_API_BASE || "").replace(
  /\/+$/,
  ""
);

function authHeaders() {
  const token = pb?.authStore?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function adminMe() {
  const res = await fetch(`${API_BASE}/api/admin/me`, {
    headers: { ...authHeaders() },
  });
  return parse(res);
}

export async function adminList(
  collection,
  { page = 1, perPage = 100, sort, filter, expand } = {}
) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("perPage", String(perPage));
  if (sort) qs.set("sort", sort);
  if (filter) qs.set("filter", filter);
  if (expand) qs.set("expand", expand);

  const res = await fetch(
    `${API_BASE}/api/admin/${collection}?${qs.toString()}`,
    {
      headers: { ...authHeaders() },
    }
  );
  return parse(res);
}

export async function adminGetOne(collection, id, { expand } = {}) {
  const qs = new URLSearchParams();
  if (expand) qs.set("expand", expand);

  const res = await fetch(
    `${API_BASE}/api/admin/${collection}/${id}?${qs.toString()}`,
    {
      headers: { ...authHeaders() },
    }
  );
  return parse(res);
}

export async function adminCreate(collection, data) {
  const res = await fetch(`${API_BASE}/api/admin/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data || {}),
  });
  return parse(res);
}

export async function adminUpdate(collection, id, data) {
  const res = await fetch(`${API_BASE}/api/admin/${collection}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data || {}),
  });
  return parse(res);
}

export async function adminDelete(collection, id) {
  const res = await fetch(`${API_BASE}/api/admin/${collection}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return parse(res);
}

export async function adminOptions(
  collection,
  { display = "name", sort = "name,label" } = {}
) {
  const qs = new URLSearchParams();
  qs.set("display", display);
  qs.set("sort", sort);

  const res = await fetch(
    `${API_BASE}/api/admin/options/${collection}?${qs.toString()}`,
    {
      headers: { ...authHeaders() },
    }
  );
  return parse(res);
}
