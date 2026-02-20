// AdminPanel.jsx (DROP-IN)
// ✅ Refactor: smaller components for maintainability
// ✅ Adds Mailing List section:
//    - time range selector [1 day, 1 week, 1 month, 6 months, 1 year, year to date]
//    - default = 1 month
//    - server-side filter: only records with created >= computed start date
//    - export CSV button
//    - table w/ checkbox in col 1; checking deletes record (with confirm)
// ✅ Keeps your existing Teams + Team Members inline edit + image upload behavior

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ChevronLeft,
  Search,
  Edit3,
  Download,
} from "lucide-react";
import pb from "@/db/pocketbase";

import {
  adminMe,
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminOptions,
} from "@/data/adminApi";

/* ---------- Utilities ---------- */
function fileToObjectUrl(file) {
  if (!file) return "";
  try {
    return URL.createObjectURL(file);
  } catch {
    return "";
  }
}

const formatUSD = (val) => {
  const n = Number.parseFloat(val ?? "0");
  if (Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n}`;
  }
};

const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
      d.getHours(),
    )}:${p(d.getMinutes())}`;
  } catch {
    return "";
  }
};

const fromDatetimeLocal = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    return d.toISOString();
  } catch {
    return "";
  }
};

function safeJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val;
}
function normalizeJsonArray(val) {
  const parsed = safeJson(val, []);
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === "string" && parsed) return [parsed];
  return [];
}
function normalizeJsonObject(val) {
  const parsed = safeJson(val, {});
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
    return parsed;
  return {};
}

/* ---------- CSV ---------- */
function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function flattenRowForCsv(row, columns) {
  const out = {};
  for (const k of columns) {
    const v = row?.[k];
    if (v == null) out[k] = "";
    else if (typeof v === "object") out[k] = JSON.stringify(v);
    else out[k] = String(v);
  }
  return out;
}

function downloadCsv(filename, rows) {
  if (!rows?.length) {
    alert("Nothing to export.");
    return;
  }

  // Choose columns from union of primitive-ish keys (ignore expand)
  const keySet = new Set();
  for (const r of rows) {
    Object.keys(r || {}).forEach((k) => {
      if (k === "expand") return;
      keySet.add(k);
    });
  }
  const columns = Array.from(keySet);

  const flat = rows.map((r) => flattenRowForCsv(r, columns));
  const header = columns.map(csvEscape).join(",");
  const body = flat
    .map((r) => columns.map((c) => csvEscape(r[c])).join(","))
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/* ---------- Date ranges (Mailing List) ---------- */
const TIME_RANGES = [
  { key: "1d", label: "1 day" },
  { key: "1w", label: "1 week" },
  { key: "1m", label: "1 month" },
  { key: "6m", label: "6 months" },
  { key: "1y", label: "1 year" },
  { key: "ytd", label: "Year to date" },
];

function computeStartISO(rangeKey) {
  const now = new Date();
  const d = new Date(now);

  if (rangeKey === "ytd") {
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  switch (rangeKey) {
    case "1d":
      d.setDate(d.getDate() - 1);
      break;
    case "1w":
      d.setDate(d.getDate() - 7);
      break;
    case "1m":
      d.setMonth(d.getMonth() - 1);
      break;
    case "6m":
      d.setMonth(d.getMonth() - 6);
      break;
    case "1y":
      d.setFullYear(d.getFullYear() - 1);
      break;
    default:
      d.setMonth(d.getMonth() - 1);
      break;
  }

  return d.toISOString();
}

/* ---------- Menu ---------- */
const MENU = [
  { key: "pages", label: "Pages" },
  { key: "ws_users", label: "Users" },
  { key: "teams", label: "Teams" },
  { key: "test", label: "Tests" },
  { key: "test_category", label: "Test Categories" },
  { key: "cart", label: "Carts" },
  { key: "testimonial", label: "Testimonials" },
  { key: "mailing_list", label: "Mailing List" }, // ✅ NEW
];

/**
 * Some PB projects have a typo for members field (e.g. team_menbers).
 * We’ll support both by expanding both and auto-detecting which one exists.
 */
const MEMBERS_FIELD_CANDIDATES = ["members", "team_menbers"];

function pickMembersFieldFromRecord(r) {
  if (!r) return MEMBERS_FIELD_CANDIDATES[0];
  for (const k of MEMBERS_FIELD_CANDIDATES) {
    if (Array.isArray(r?.[k])) return k;
  }
  for (const k of MEMBERS_FIELD_CANDIDATES) {
    if (Array.isArray(r?.expand?.[k])) return k;
  }
  return MEMBERS_FIELD_CANDIDATES[0];
}

/* ---------- Field configuration (CRUD sections) ---------- */
const FIELD_CONFIG = {
  pages: {
    listColumns: [
      { key: "label", header: "Label" },
      {
        key: "route",
        header: "Route",
        render: (r) => r?.path || r?.external_url || "—",
      },
      {
        key: "show_in_nav",
        header: "Show in Nav",
        render: (r) => (r?.show_in_nav ? "Yes" : "No"),
      },
      {
        key: "show_in_footer",
        header: "Show in Footer",
        render: (r) => (r?.show_in_footer ? "Yes" : "No"),
      },
      {
        key: "published",
        header: "Published",
        render: (r) => (r?.published ? "Yes" : "No"),
      },
      {
        key: "roles",
        header: "Roles",
        render: (r) =>
          Array.isArray(r?.roles) && r.roles.length
            ? r.roles.join(", ")
            : "public",
      },
      { key: "order", header: "Order" },
      {
        key: "window",
        header: "Window",
        render: (r) => {
          const s = r?.start_at ? new Date(r.start_at).toLocaleString() : "—";
          const e = r?.end_at ? new Date(r.end_at).toLocaleString() : "—";
          return `${s} → ${e}`;
        },
      },
    ],
    formFields: [
      { key: "label", label: "Label", type: "text" },
      { key: "path", label: "Internal Path (e.g. /tests)", type: "text" },
      {
        key: "external_url",
        label: "External URL (if not path)",
        type: "text",
      },
      { key: "order", label: "Order", type: "number" },
      {
        key: "roles",
        label: "Visible To",
        type: "multiselect",
        options: ["public", "authed", "admin"],
      },
      { key: "published", label: "Published", type: "checkbox" },
      { key: "show_in_nav", label: "Show in Nav", type: "checkbox" },
      { key: "show_in_footer", label: "Show in Footer", type: "checkbox" },
      { key: "start_at", label: "Start At", type: "datetime" },
      { key: "end_at", label: "End At", type: "datetime" },
      { key: "icon_name", label: "Icon Name (optional)", type: "text" },
      { key: "feature_flag", label: "Feature Flag (optional)", type: "text" },
    ],
    sort: "order,label",
  },

  ws_users: {
    listColumns: [
      { key: "email", header: "Email" },
      { key: "fname", header: "First" },
      { key: "lname", header: "Last" },
      { key: "phone", header: "Phone" },
      {
        key: "isAdmin",
        header: "Admin",
        render: (r) => (r?.isAdmin ? "Yes" : "No"),
      },
      { key: "updated", header: "Updated" },
    ],
    formFields: [
      { key: "email", label: "Email", type: "text" },
      { key: "fname", label: "First name", type: "text" },
      { key: "lname", label: "Last name", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "isAdmin", label: "Admin", type: "checkbox" },
      { key: "lockedOut", label: "Locked Out", type: "checkbox" },
    ],
  },

  teams: {
    listColumns: [
      { key: "title", header: "Title" },
      { key: "order", header: "Order" },
      {
        key: "members_count",
        header: "Members",
        render: (r) => {
          const k = pickMembersFieldFromRecord(r);
          const expanded = r?.expand?.[k];
          if (Array.isArray(expanded)) return `${expanded.length}`;
          if (Array.isArray(r?.[k])) return `${r[k].length}`;
          return "0";
        },
      },
      { key: "updated", header: "Updated" },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text" },
      { key: "order", label: "Order", type: "number" },
      {
        key: "members",
        label: "Members",
        type: "multirelation",
        collection: "team_members",
        display: "name",
      },
    ],
    sort: "order,title",
  },

  team_members: {
    formFields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "image", label: "Profile Image", type: "file" },
      { key: "order", label: "Order", type: "number" },
    ],
  },

  test_category: {
    listColumns: [
      { key: "name", header: "Name" },
      { key: "updated", header: "Updated" },
    ],
    formFields: [{ key: "name", label: "Name", type: "text" }],
  },

  test: {
    listColumns: [
      { key: "show", header: "Show", render: (r) => (r?.show ? "Yes" : "No") },
      { key: "name", header: "Name" },
      {
        key: "cat_id",
        header: "Category",
        render: (r) => r?.expand?.cat_id?.name ?? "—",
      },
      { key: "cost", header: "Cost", render: (r) => formatUSD(r?.cost) },
      {
        key: "available",
        header: "Available",
        render: (r) => (r?.available ? "Yes" : "No"),
      },
      {
        key: "included_test",
        header: "Includes Test",
        render: (r) =>
          r?.top_level_test
            ? Array.isArray(r?.included_test)
              ? r.included_test.length
              : Array.isArray(r?.expand?.included_test)
                ? r.expand.included_test.length
                : 0
            : "—",
      },
    ],
    formFields: [
      { key: "show", label: "Show (visible)", type: "checkbox" },
      { key: "name", label: "Name", type: "text" },
      {
        key: "cat_id",
        label: "Category",
        type: "relation",
        collection: "test_category",
        display: "name",
      },
      { key: "cost", label: "Cost", type: "number" },
      { key: "measured", label: "Measured", type: "text" },
      { key: "description", label: "Short Description", type: "textarea" },
      { key: "description_long", label: "Long Description", type: "textarea" },
      { key: "who", label: "Who", type: "text" },
      { key: "frequency", label: "Frequency", type: "text" },
      { key: "available", label: "Available", type: "checkbox" },
      {
        key: "top_level_test",
        label: "Includes Test (Top Level)",
        type: "checkbox",
      },
      {
        key: "included_test",
        label: "Included Tests",
        type: "multirelation",
        collection: "test",
        display: "name",
      },
    ],
  },

  cart: {
    listColumns: [
      {
        key: "user",
        header: "User",
        render: (r) => {
          const u = r?.expand?.user;
          if (!u) return r?.user ?? "—";
          const name = [u.fname, u.lname].filter(Boolean).join(" ").trim();
          return name || u.email || r.user || "—";
        },
      },
      { key: "status", header: "Status" },
      {
        key: "test",
        header: "Tests in Cart",
        render: (r) => {
          const tests = r?.expand?.test;
          if (!Array.isArray(tests) || tests.length === 0) return "—";
          return tests.map((t) => t?.name ?? t?.id).join(", ");
        },
      },
      { key: "last_activity_at", header: "Last Activity" },
    ],
    formFields: [
      {
        key: "user",
        label: "User",
        type: "relation",
        collection: "ws_users",
        display: "email",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["open", "submitted"],
      },
      {
        key: "test",
        label: "Tests",
        type: "multirelation",
        collection: "test",
        display: "name",
      },
      {
        key: "last_activity_at",
        label: "Last Activity (text/timestamp)",
        type: "text",
      },
    ],
  },

  testimonial: {
    listColumns: [
      { key: "name", header: "Name" },
      { key: "role", header: "Role" },
      { key: "rating", header: "Rating" },
      { key: "show", header: "Show", render: (r) => (r?.show ? "Yes" : "No") },
      {
        key: "reviewed",
        header: "Reviewed",
        render: (r) => (r?.reviewed ? "Yes" : "No"),
      },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "rating", label: "Rating (1–5)", type: "number" },
      { key: "content", label: "Content", type: "textarea" },
      { key: "image", label: "Image (filename/url)", type: "text" },
      { key: "show", label: "Show", type: "checkbox" },
      { key: "reviewed", label: "Reviewed", type: "checkbox" },
    ],
  },
};

/* ---------- UI Primitives ---------- */
function UIButton({ className = "", variant = "primary", ...rest }) {
  const base =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-transparent text-slate-700 hover:bg-slate-100";
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60 ${base} ${className}`}
    />
  );
}
function UIInput({ className = "", ...rest }) {
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
    />
  );
}
function UITextarea({ className = "", ...rest }) {
  return (
    <textarea
      {...rest}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
    />
  );
}

/* ---------- Options helper ---------- */
/* ---------- Site Settings (global) ---------- */
async function getSiteSettings() {
  // Expecting a single record keyed by "global"
  // If it doesn't exist yet, we'll return defaults.
  try {
    const res = await adminList("site_settings", {
      page: 1,
      perPage: 1,
      filter: `key = "global"`,
      sort: "",
    });
    const item = res?.items?.[0];
    if (!item?.id) return { id: null, show_footer: true };
    return { id: item.id, show_footer: item.show_footer ?? true };
  } catch {
    return { id: null, show_footer: true };
  }
}

async function upsertSiteSettings(patch) {
  // Creates if missing; updates if present
  const current = await getSiteSettings();
  if (current.id) {
    const res = await adminUpdate("site_settings", current.id, patch);
    return { id: res?.item?.id ?? current.id, ...res?.item };
  }
  const res = await adminCreate("site_settings", {
    key: "global",
    show_footer: patch?.show_footer ?? true,
  });
  return { id: res?.item?.id ?? null, ...res?.item };
}

async function fetchOptions(collection, display) {
  const res = await adminOptions(collection, { display, sort: "name,label" });
  return res.options || [];
}

/* ---------- JsonEditor ---------- */
function JsonEditor({ value, onChange, placeholder }) {
  const [txt, setTxt] = useState(() => {
    if (value == null || value === "") return "";
    try {
      return typeof value === "string" ? value : JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (value == null || value === "") {
      setTxt("");
      setErr("");
      return;
    }
    try {
      const next =
        typeof value === "string" ? value : JSON.stringify(value, null, 2);
      setTxt(next);
      setErr("");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  const commit = (nextTxt) => {
    setTxt(nextTxt);
    if (!nextTxt.trim()) {
      setErr("");
      onChange("");
      return;
    }
    try {
      const parsed = JSON.parse(nextTxt);
      setErr("");
      onChange(parsed);
    } catch {
      setErr("Invalid JSON");
    }
  };

  return (
    <div>
      <UITextarea
        rows={6}
        value={txt}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value)}
      />
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
    </div>
  );
}

/* ============================================================================
   Team Member Modals (kept, but isolated)
============================================================================ */

function EditTeamMemberModal({ open, onClose, member, onSaved, onDeleted }) {
  const [inputs, setInputs] = useState({
    name: "",
    role: "",
    bio: "",
    image: "",
    tags: [],
    socials: {},
    order: "",
  });
  console.log("Member", member);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const m = member || {};
    setInputs({
      name: m.name ?? "",
      role: m.role ?? "",
      bio: m.bio ?? "",
      image: m.image ?? "",
      tags: normalizeJsonArray(m.tags),
      socials: normalizeJsonObject(m.socials),
      order: m.order ?? "",
    });

    setImageFile(null);
    setImagePreview("");
  }, [open, member]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handle = (k, v) => setInputs((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!member?.id) return;
    setSaving(true);

    try {
      const fd = new FormData();
      fd.set("name", inputs.name ?? "");
      fd.set("role", inputs.role ?? "");
      fd.set("bio", inputs.bio ?? "");
      fd.set(
        "order",
        inputs.order === "" || inputs.order == null ? "" : String(inputs.order),
      );
      fd.set("tags", JSON.stringify(inputs.tags ?? []));
      fd.set("socials", JSON.stringify(inputs.socials ?? {}));
      if (imageFile) fd.set("image", imageFile);

      const res = await adminUpdate("team_members", member.id, fd);
      onSaved?.(res?.item);
      onClose?.();
    } catch (e) {
      alert(e?.message ?? "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!member?.id) return;

    const ok = window.confirm(
      `Delete member "${member?.name || member?.id}"?\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await adminDelete("team_members", member.id);
      onDeleted?.(member.id);
      onClose?.();
    } catch (e) {
      alert(e?.message ?? "Failed to delete member");
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  const existingImage = inputs.image ? String(inputs.image) : "";
  const previewSrc = imagePreview || (existingImage ? existingImage : "");

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-5 w-5 cursor-pointer" onClick={onClose} />
            <h2 className="text-lg font-semibold">Edit Team Member</h2>
          </div>
          <UIButton
            onClick={save}
            disabled={saving || deleting || !inputs.name?.trim()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            Save
          </UIButton>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <UIInput
              value={inputs.name}
              onChange={(e) => handle("name", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <UIInput
              value={inputs.role}
              onChange={(e) => handle("role", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Bio</span>
            <UITextarea
              rows={4}
              value={inputs.bio}
              onChange={(e) => handle("bio", e.target.value)}
            />
          </label>

          <div className="md:col-span-2">
            <div className="mb-1 text-sm font-medium text-slate-700">
              Profile Image
            </div>

            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {previewSrc ? (
                  <img
                    src={pb.files.getURL(member, member.image)}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    —
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setImageFile(f);
                    if (imagePreview?.startsWith("blob:"))
                      URL.revokeObjectURL(imagePreview);
                    setImagePreview(f ? fileToObjectUrl(f) : "");
                  }}
                />
                <div className="mt-1 text-xs text-slate-500">
                  Upload a JPG/PNG/WebP. Saving will replace the current image.
                </div>
              </div>

              {(imageFile || inputs.image) && (
                <UIButton
                  type="button"
                  variant="ghost"
                  className="border border-slate-200"
                  onClick={() => {
                    setImageFile(null);
                    if (imagePreview?.startsWith("blob:"))
                      URL.revokeObjectURL(imagePreview);
                    setImagePreview("");
                  }}
                >
                  Clear
                </UIButton>
              )}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Order</span>
            <UIInput
              type="number"
              value={inputs.order}
              onChange={(e) =>
                handle(
                  "order",
                  e.target.value === "" ? "" : e.target.valueAsNumber,
                )
              }
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <UIButton variant="ghost" onClick={onClose}>
            Cancel
          </UIButton>

          <button
            onClick={del}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            title="Delete member"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete member
          </button>
        </div>

        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <b>Warning:</b> deleting a member removes the record from PocketBase.
          You may also want to remove them from any teams that reference them.
        </div>
      </div>
    </div>
  );
}

function AddTeamMemberModal({ open, onClose, onCreated }) {
  const [inputs, setInputs] = useState({
    name: "",
    role: "",
    bio: "",
    tags: [],
    socials: {},
    order: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInputs({
      name: "",
      role: "",
      bio: "",
      tags: [],
      socials: {},
      order: "",
    });
    setImageFile(null);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handle = (k, v) => setInputs((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", inputs.name ?? "");
      fd.set("role", inputs.role ?? "");
      fd.set("bio", inputs.bio ?? "");
      fd.set(
        "order",
        inputs.order === "" || inputs.order == null ? "" : String(inputs.order),
      );
      fd.set("tags", JSON.stringify(inputs.tags ?? []));
      fd.set("socials", JSON.stringify(inputs.socials ?? {}));
      if (imageFile) fd.set("image", imageFile);

      const res = await adminCreate("team_members", fd);
      const created = res?.item;
      if (created?.id) onCreated?.(created);
      onClose?.();
    } catch (e) {
      alert(e?.message ?? "Failed to create member");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-5 w-5 cursor-pointer" onClick={onClose} />
            <h2 className="text-lg font-semibold">Add User</h2>
          </div>
          <UIButton onClick={save} disabled={saving || !inputs.name?.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            Save
          </UIButton>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <UIInput
              value={inputs.name}
              onChange={(e) => handle("name", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <UIInput
              value={inputs.role}
              onChange={(e) => handle("role", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Bio</span>
            <UITextarea
              rows={4}
              value={inputs.bio}
              onChange={(e) => handle("bio", e.target.value)}
            />
          </label>

          <div className="md:col-span-2">
            <div className="mb-1 text-sm font-medium text-slate-700">
              Profile Image
            </div>

            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    —
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setImageFile(f);
                    if (imagePreview?.startsWith("blob:"))
                      URL.revokeObjectURL(imagePreview);
                    setImagePreview(f ? fileToObjectUrl(f) : "");
                  }}
                />
                <div className="mt-1 text-xs text-slate-500">
                  Upload a JPG/PNG/WebP.
                </div>
              </div>

              {imageFile && (
                <UIButton
                  type="button"
                  variant="ghost"
                  className="border border-slate-200"
                  onClick={() => {
                    setImageFile(null);
                    if (imagePreview?.startsWith("blob:"))
                      URL.revokeObjectURL(imagePreview);
                    setImagePreview("");
                  }}
                >
                  Clear
                </UIButton>
              )}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Order</span>
            <UIInput
              type="number"
              value={inputs.order}
              onChange={(e) =>
                handle(
                  "order",
                  e.target.value === "" ? "" : e.target.valueAsNumber,
                )
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">
              Tags (JSON array)
            </span>
            <JsonEditor
              value={inputs.tags}
              onChange={(v) => handle("tags", v)}
              placeholder='["Legal","R&D"]'
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">
              Socials (JSON object)
            </span>
            <JsonEditor
              value={inputs.socials}
              onChange={(v) => handle("socials", v)}
              placeholder='{"linkedin":"...","email":"..."}'
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <UIButton variant="ghost" onClick={onClose}>
            Cancel
          </UIButton>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Generic Edit Modal (CRUD)
============================================================================ */
/* ============================================================================
   Generic Edit Modal (CRUD)  ✅ UPDATED: adds Delete for Teams
============================================================================ */
function EditModal({ open, onClose, collection, row, onSaved }) {
  const cfg = FIELD_CONFIG[collection];
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [relationsCache, setRelationsCache] = useState({});

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [memberEditOpen, setMemberEditOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const membersKey =
    collection === "teams" ? pickMembersFieldFromRecord(inputs || row) : null;

  useEffect(() => {
    setInputs(row ?? {});
  }, [row, open]);

  useEffect(() => {
    (async () => {
      const relKeys = (cfg?.formFields || []).filter(
        (f) => f.type === "relation" || f.type === "multirelation",
      );

      const entries = await Promise.all(
        relKeys.map(async (f) => [
          f.key,
          await fetchOptions(f.collection, f.display),
        ]),
      );

      const map = {};
      entries.forEach(([k, v]) => (map[k] = v));

      if (collection === "teams") {
        const opts = await fetchOptions("team_members", "name");
        for (const k of MEMBERS_FIELD_CANDIDATES) map[k] = opts;
      }

      setRelationsCache(map);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, open]);

  const handleChange = (key, val) => setInputs((s) => ({ ...s, [key]: val }));

  const toggleIncluded = (id) => {
    const current = Array.isArray(inputs.included_test)
      ? inputs.included_test
      : [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setInputs((s) => ({ ...s, included_test: next }));
  };

  const toggleMulti = (key, opt) => {
    const curr = Array.isArray(inputs[key]) ? inputs[key] : [];
    const next = curr.includes(opt)
      ? curr.filter((x) => x !== opt)
      : [...curr, opt];
    setInputs((s) => ({ ...s, [key]: next }));
  };

  const refreshTeamMemberOptions = async () => {
    const opts = await fetchOptions("team_members", "name");
    setRelationsCache((s) => {
      const next = { ...s };
      for (const k of MEMBERS_FIELD_CANDIDATES) next[k] = opts;
      return next;
    });
    return opts;
  };

  const attachMemberToTeamNow = async (memberId) => {
    const key = membersKey || MEMBERS_FIELD_CANDIDATES[0];
    const curr = Array.isArray(inputs?.[key]) ? inputs[key] : [];
    const next = curr.includes(memberId) ? curr : [...curr, memberId];

    handleChange(key, next);

    if (collection === "teams" && row?.id) {
      await adminUpdate("teams", row.id, { [key]: next });
      onSaved?.();
    }
  };

  const removeMemberFromTeamNow = async (memberId) => {
    const key = membersKey || MEMBERS_FIELD_CANDIDATES[0];
    const curr = Array.isArray(inputs?.[key]) ? inputs[key] : [];
    const next = curr.filter((x) => x !== memberId);
    handleChange(key, next);

    if (collection === "teams" && row?.id) {
      await adminUpdate("teams", row.id, { [key]: next });
      onSaved?.();
    }
  };

  const buildPayload = () => {
    const hasFile = cfg.formFields.some(
      (f) => f.type === "file" && inputs?.[f.key] instanceof File,
    );

    if (!hasFile) {
      const payload = {};
      for (const f of cfg.formFields) {
        let v = inputs[f.key];
        if (f.type === "checkbox") payload[f.key] = !!v;
        else if (f.type === "datetime")
          payload[f.key] = v ? fromDatetimeLocal(v) : "";
        else if (f.type === "number")
          payload[f.key] = v === "" || v == null ? "" : v;
        else if (f.type === "relation") payload[f.key] = v ?? "";
        else if (f.type === "multirelation")
          payload[f.key] = Array.isArray(v) ? v : [];
        else if (f.type === "multiselect")
          payload[f.key] = Array.isArray(v) ? v : [];
        else if (f.type === "json")
          payload[f.key] = v === "" || v == null ? "" : v;
        else payload[f.key] = v ?? "";
      }
      return payload;
    }

    const fd = new FormData();

    for (const f of cfg.formFields) {
      let v = inputs[f.key];

      if (f.type === "checkbox") fd.append(f.key, String(!!v));
      else if (f.type === "datetime")
        fd.append(f.key, v ? fromDatetimeLocal(v) : "");
      else if (f.type === "number")
        fd.append(f.key, v === "" || v == null ? "" : String(v));
      else if (f.type === "relation") fd.append(f.key, v ?? "");
      else if (f.type === "multirelation") {
        const arr = Array.isArray(v) ? v : [];
        arr.forEach((id) => fd.append(f.key, id));
      } else if (f.type === "multiselect") {
        const arr = Array.isArray(v) ? v : [];
        arr.forEach((opt) => fd.append(f.key, opt));
      } else if (f.type === "json") {
        if (v === "" || v == null) fd.append(f.key, "");
        else fd.append(f.key, typeof v === "string" ? v : JSON.stringify(v));
      } else if (f.type === "file") {
        if (v instanceof File) fd.append(f.key, v);
      } else {
        fd.append(f.key, v ?? "");
      }
    }

    return fd;
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload = buildPayload();

      const saved = row?.id
        ? await adminUpdate(collection, row.id, payload)
        : await adminCreate(collection, payload);

      onSaved?.(saved?.item);
      onClose?.();
    } catch (e) {
      alert(e?.message ?? "Save failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Delete Team button handler
  const deleteTeam = async () => {
    if (collection !== "teams" || !row?.id) return;

    const label = inputs?.title || row?.title || row?.id;
    const ok = window.confirm(
      `Delete team "${label}"?\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await adminDelete("teams", row.id);
      onClose?.();
      onSaved?.(); // refresh list
    } catch (e) {
      alert(e?.message ?? "Failed to delete team");
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        {/* Header (fixed) */}
        <div className="p-5 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronLeft
                className="h-5 w-5 cursor-pointer"
                onClick={onClose}
              />
              <h2 className="text-lg font-semibold">
                {row?.id ? "Edit" : "Add"} {collection}
              </h2>
            </div>
            <UIButton onClick={save} disabled={loading || deleting}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              Save
            </UIButton>
          </div>
        </div>

        {/* Body (scrolls) */}
        <div className="flex-1 overflow-y-auto p-5 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cfg.formFields.map((f) => {
              // ✅ File input (if you ever add file fields to EditModal configs)
              if (f.type === "file") {
                return (
                  <div
                    key={f.key}
                    className="md:col-span-2 flex items-center gap-3"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleChange(f.key, file);
                      }}
                    />
                    {inputs?.[f.key] instanceof File && (
                      <span className="text-xs text-slate-500">
                        {inputs[f.key].name}
                      </span>
                    )}
                  </div>
                );
              }

              let v = inputs?.[f.key];
              if (f.type === "datetime") v = toDatetimeLocal(v);

              // Included tests selector
              if (collection === "test" && f.key === "included_test") {
                const showBlock = !!inputs?.top_level_test;
                return (
                  <div key={f.key} className="md:col-span-2">
                    <div className="mb-2 text-sm font-medium text-slate-700">
                      {f.label}
                    </div>

                    {!showBlock ? (
                      <div className="text-xs text-slate-500">
                        Check <b>“Includes Test (Top Level)”</b> to select
                        included tests.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        {/* Keep this inner scroll too, but it now lives inside a scrolling modal body */}
                        <div className="max-h-64 overflow-y-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-50">
                                  Test Name
                                </th>
                                <th className="sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-50">
                                  Included
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {(relationsCache[f.key] || []).map((opt) => {
                                const checked = Array.isArray(inputs?.[f.key])
                                  ? inputs[f.key].includes(opt.id)
                                  : false;
                                const disabled = row?.id && opt.id === row.id;

                                return (
                                  <tr key={opt.id}>
                                    <td className="px-3 py-2 text-sm text-slate-700">
                                      {opt.label}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="checkbox"
                                        disabled={disabled}
                                        checked={checked}
                                        onChange={() => toggleIncluded(opt.id)}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Teams Members block (unchanged)
              if (
                collection === "teams" &&
                f.type === "multirelation" &&
                f.collection === "team_members"
              ) {
                const key = membersKey || MEMBERS_FIELD_CANDIDATES[0];
                const opts = relationsCache[key] || [];
                const curr = Array.isArray(inputs?.[key]) ? inputs[key] : [];

                const memberById = (id) => {
                  const expandedArr = Array.isArray(inputs?.expand?.[key])
                    ? inputs.expand[key]
                    : Array.isArray(row?.expand?.[key])
                      ? row.expand[key]
                      : null;
                  const fromExpand = expandedArr?.find((m) => m?.id === id);
                  if (fromExpand) return fromExpand;
                  const opt = (opts || []).find((o) => o.id === id);
                  return opt ? { id: opt.id, name: opt.label } : { id };
                };

                return (
                  <div key={f.key} className="md:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-700">
                        {f.label}
                      </div>
                      <UIButton
                        type="button"
                        variant="ghost"
                        onClick={() => setAddUserOpen(true)}
                        className="border border-slate-200"
                      >
                        <Plus className="h-4 w-4" />
                        Add User
                      </UIButton>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-2">
                      <div className="flex flex-wrap gap-2">
                        {opts.map((o) => {
                          const checked = curr.includes(o.id);

                          return (
                            <div
                              key={o.id}
                              className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
                                checked
                                  ? "border-slate-900 bg-slate-50"
                                  : "border-slate-200"
                              }`}
                            >
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? curr.filter((x) => x !== o.id)
                                      : [...curr, o.id];
                                    handleChange(key, next);
                                  }}
                                />
                                <span>{o.label}</span>
                              </label>

                              {checked && (
                                <button
                                  type="button"
                                  title="Edit member"
                                  className="ml-1 inline-flex items-center justify-center rounded-md p-1 text-slate-600 hover:bg-slate-200"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMemberToEdit(memberById(o.id));
                                    setMemberEditOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {opts.length === 0 && (
                          <div className="text-xs text-slate-500">
                            No users found yet. Click <b>Add User</b> to create
                            one.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Using team field: <b>{key}</b>
                    </div>

                    <AddTeamMemberModal
                      open={addUserOpen}
                      onClose={() => setAddUserOpen(false)}
                      onCreated={async (created) => {
                        await refreshTeamMemberOptions();
                        await attachMemberToTeamNow(created.id);
                      }}
                    />

                    <EditTeamMemberModal
                      open={memberEditOpen}
                      member={memberToEdit}
                      onClose={() => {
                        setMemberEditOpen(false);
                        setMemberToEdit(null);
                      }}
                      onSaved={async () => {
                        await refreshTeamMemberOptions();
                        if (row?.id) {
                          const fresh = await adminList("teams", {
                            page: 1,
                            perPage: 1,
                            sort: "",
                            filter: `id = "${row.id}"`,
                            expand: MEMBERS_FIELD_CANDIDATES.join(","),
                          });
                          const nextTeam = fresh?.items?.[0];
                          if (nextTeam) setInputs(nextTeam);
                        }
                        onSaved?.();
                      }}
                      onDeleted={async (deletedId) => {
                        await removeMemberFromTeamNow(deletedId);
                        await refreshTeamMemberOptions();
                      }}
                    />
                  </div>
                );
              }

              return (
                <label key={f.key} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">{f.label}</span>

                  {f.type === "text" && (
                    <UIInput
                      value={v ?? ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                    />
                  )}

                  {f.type === "number" && (
                    <UIInput
                      type="number"
                      value={v ?? ""}
                      onChange={(e) =>
                        handleChange(
                          f.key,
                          e.target.value === "" ? "" : e.target.valueAsNumber,
                        )
                      }
                    />
                  )}

                  {f.type === "textarea" && (
                    <UITextarea
                      rows={4}
                      value={v ?? ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                    />
                  )}

                  {f.type === "checkbox" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!inputs?.[f.key]}
                        onChange={(e) => handleChange(f.key, e.target.checked)}
                      />
                    </div>
                  )}

                  {f.type === "select" && (
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={v ?? ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                    >
                      <option value="">—</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}

                  {f.type === "multiselect" && (
                    <div className="rounded-lg border border-slate-200 p-2">
                      <div className="flex flex-wrap gap-2">
                        {f.options.map((opt) => {
                          const checked = Array.isArray(inputs?.[f.key])
                            ? inputs[f.key].includes(opt)
                            : false;
                          return (
                            <label
                              key={opt}
                              className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMulti(f.key, opt)}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {f.type === "relation" && (
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={inputs?.[f.key] ?? ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                    >
                      <option value="">—</option>
                      {(relationsCache[f.key] || []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {f.type === "datetime" && (
                    <UIInput
                      type="datetime-local"
                      value={v ?? ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                    />
                  )}

                  {f.type === "json" && (
                    <JsonEditor
                      value={inputs?.[f.key]}
                      onChange={(parsed) => handleChange(f.key, parsed)}
                      placeholder={
                        f.key === "tags"
                          ? '["Legal","R&D"]'
                          : '{"linkedin":"...","email":"..."}'
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer (fixed) */}
        <div className="p-5 pt-3 border-t border-slate-200 flex items-center justify-between">
          <UIButton variant="ghost" onClick={onClose}>
            Cancel
          </UIButton>

          {collection === "teams" && row?.id ? (
            <button
              type="button"
              onClick={deleteTeam}
              disabled={loading || deleting}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              title="Delete Team"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Team
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SideNav + Page Shell
============================================================================ */
function SideNav({ active, onSelect }) {
  return (
    <aside className="w-60 shrink-0 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Control Panel
      </div>
      <nav className="space-y-1">
        {MENU.map((m) => {
          const activeCls =
            m.key === active
              ? "bg-slate-900 text-white"
              : "hover:bg-slate-100 text-slate-700";
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium ${activeCls}`}
            >
              {m.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function PageHeader({ title, right }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

/* ============================================================================
   CRUD view for standard collections
============================================================================ */
function CollectionCrudView({ collection }) {
  const cfg = FIELD_CONFIG[collection];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(undefined);
  const [page, setPage] = useState(1);
  const [showFooter, setShowFooter] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadSettings() {
      if (collection !== "pages") return;
      setSettingsLoading(true);
      const s = await getSiteSettings();
      if (!alive) return;
      setShowFooter(!!s.show_footer);
      setSettingsLoading(false);
    }
    loadSettings();
    return () => {
      alive = false;
    };
  }, [collection]);

  const buildFilter = (c, query) => {
    if (!query) return "";
    if (c === "ws_users")
      return `email ~ "${query}" || fname ~ "${query}" || lname ~ "${query}"`;
    if (c === "test" || c === "test_category" || c === "testimonial")
      return `name ~ "${query}"`;
    if (c === "cart") return `status ~ "${query}"`;
    if (c === "pages")
      return `label ~ "${query}" || path ~ "${query}" || external_url ~ "${query}"`;
    if (c === "teams") return `title ~ "${query}"`;
    return "";
  };

  const load = async (pageNo = 1) => {
    setLoading(true);
    try {
      const expand =
        collection === "test"
          ? "cat_id,included_test"
          : collection === "cart"
            ? "user,test"
            : collection === "teams"
              ? MEMBERS_FIELD_CANDIDATES.join(",")
              : undefined;

      const sort =
        cfg?.sort ?? (collection === "pages" ? "order,label" : "-updated");

      const res = await adminList(collection, {
        page: pageNo,
        perPage: 100,
        sort,
        filter: buildFilter(collection, q),
        expand,
      });

      setItems(res.items || []);
      setPage(pageNo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  const openAdd = () => {
    setEditRow(undefined);
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditRow(row);
    setModalOpen(true);
  };
  const remove = async (row) => {
    const ok = window.confirm(`Delete this ${collection} record?`);
    if (!ok) return;
    await adminDelete(collection, row.id);
    await load(page);
  };

  const headers = cfg.listColumns;
  const rows = useMemo(() => items, [items]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        {collection === "pages" && (
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={!!showFooter}
              disabled={settingsLoading}
              onChange={async (e) => {
                const next = e.target.checked;
                setShowFooter(next); // optimistic
                try {
                  await upsertSiteSettings({ show_footer: next });
                } catch (err) {
                  // revert if save fails
                  setShowFooter((prev) => !prev);
                  alert(err?.message ?? "Failed to update setting");
                }
              }}
            />
            <span className="font-medium">Show footer</span>
            {settingsLoading && (
              <span className="ml-2 text-xs text-slate-500">Saving…</span>
            )}
          </label>
        )}

        <UIButton onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add New
        </UIButton>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h.key}
                    className="sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-50"
                  >
                    {h.header}
                  </th>
                ))}
                <th className="sticky top-0 z-10 px-3 py-2 bg-slate-50" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td
                    colSpan={headers.length + 1}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => openEdit(row)}
                  >
                    {headers.map((h) => (
                      <td
                        key={h.key}
                        className="px-3 py-2 text-sm text-slate-700"
                      >
                        {h.render ? h.render(row) : (row[h.key] ?? "—")}
                      </td>
                    ))}
                    <td
                      className="px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => remove(row)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={headers.length + 1}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        collection={collection}
        row={editRow}
        onSaved={() => load(page)}
      />
    </div>
  );
}

/* ============================================================================
   ✅ Mailing List view (time filter + export + checkbox delete)
============================================================================ */
function MailingListView() {
  const [range, setRange] = useState("1m");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const startISO = computeStartISO(range);

      const search = q.trim()
        ? `(fname ~ "${q}" || lname ~ "${q}" || email ~ "${q}" || phone ~ "${q}")`
        : "";

      const filter = search
        ? `created >= "${startISO}" && ${search}`
        : `created >= "${startISO}"`;

      const res = await adminList("mailing_list", {
        page: 1,
        perPage: 500,
        sort: "-created",
        filter,
      });

      setRows(res.items || []);
    } catch (e) {
      alert("Failed loading mailing list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [range]);

  const deleteRow = async (row) => {
    if (!window.confirm(`Delete ${row.email}?`)) return;
    await adminDelete("mailing_list", row.id);
    setRows((s) => s.filter((r) => r.id !== row.id));
  };

  const exportCsv = () => {
    const data = rows.map((r) => ({
      fname: r.fname || "",
      lname: r.lname || "",
      email: r.email || "",
      phone: r.phone || "",
      created: r.created ? new Date(r.created).toLocaleString() : "",
    }));
    downloadCsv("attest_leads.csv", data);
  };

  return (
    <div>
      <div className="mb-3 flex justify-between">
        <div className="flex gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="ytd">Year to Date</option>
          </select>

          <input
            placeholder="Search leads..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={exportCsv}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th></th>
              <th>First</th>
              <th>Last</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Loading…
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <input type="checkbox" onChange={() => deleteRow(r)} />
                  </td>
                  <td className="p-2">{r.fname}</td>
                  <td className="p-2">{r.lname}</td>
                  <td className="p-2 font-medium">{r.email}</td>
                  <td className="p-2">{r.phone}</td>
                  <td className="p-2">
                    {new Date(r.created).toLocaleString()}
                  </td>
                </tr>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  No leads in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   Main Admin Panel
============================================================================ */
export default function AdminPanel() {
  const [active, setActive] = useState("pages");
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        if (!pb.authStore?.isValid || !pb.authStore?.token) {
          navigate("/auth");
          return;
        }
        await adminMe();
        setReady(true);
      } catch {
        navigate("/auth");
      }
    };
    run();
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking access…
      </div>
    );
  }

  const title = MENU.find((m) => m.key === active)?.label || active;

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[520px] gap-5">
      <SideNav active={active} onSelect={setActive} />

      <main className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
        <PageHeader title={title} />

        {active === "mailing_list" ? (
          <MailingListView />
        ) : (
          <CollectionCrudView collection={active} />
        )}
      </main>
    </div>
  );
}
