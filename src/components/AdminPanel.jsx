// AdminPanel.jsx (DROP-IN)
// ✅ Teams CRUD
// ✅ Team Members are created from Teams via "Add User" (no left-nav link)
// ✅ When a member is created, it is immediately added to teams.members (or teams.team_menbers)
// ✅ Uses your server-backed adminApi helpers

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ChevronLeft,
  Search,
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
      d.getHours()
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

/* ---------- Menu ---------- */
const MENU = [
  { key: "pages", label: "Pages" },
  { key: "ws_users", label: "Users" },
  { key: "teams", label: "Teams" },
  { key: "test", label: "Tests" },
  { key: "test_category", label: "Test Categories" },
  { key: "cart", label: "Carts" },
  { key: "testimonial", label: "Testimonials" },
];

/**
 * Some PB projects have a typo for members field (e.g. team_menbers).
 * We’ll support both by expanding both and auto-detecting which one exists.
 */
const MEMBERS_FIELD_CANDIDATES = ["members", "team_menbers"];

function pickMembersFieldFromRecord(r) {
  if (!r) return MEMBERS_FIELD_CANDIDATES[0];

  // Prefer a field that exists on the record (ids array)
  for (const k of MEMBERS_FIELD_CANDIDATES) {
    if (Array.isArray(r?.[k])) return k;
  }
  // Prefer a field that exists in expand
  for (const k of MEMBERS_FIELD_CANDIDATES) {
    if (Array.isArray(r?.expand?.[k])) return k;
  }
  return MEMBERS_FIELD_CANDIDATES[0];
}

/* ---------- Field configuration ---------- */
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

  /* ✅ Teams */
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

      // keep a single config slot, but we’ll read/write whichever key exists
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

  /* (Hidden) team_members config used by Add User modal */
  team_members: {
    formFields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "image", label: "Image (url/filename)", type: "text" },
      { key: "tags", label: "Tags (JSON array)", type: "json" },
      { key: "socials", label: "Socials (JSON object)", type: "json" },
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

/* ---------- Small UI helpers ---------- */
function Button(props) {
  const { className = "", variant = "primary", ...rest } = props;
  const base =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-transparent text-slate-700 hover:bg-slate-100";
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${base} ${className}`}
    />
  );
}
function Input(props) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
    />
  );
}
function Textarea(props) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
    />
  );
}

/* ---------- Helpers ---------- */
async function fetchOptions(collection, display) {
  const res = await adminOptions(collection, { display, sort: "name,label" });
  return res.options || [];
}

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
      <Textarea
        rows={6}
        value={txt}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value)}
      />
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
    </div>
  );
}

/* ---------- Add User (team_member) modal ---------- */
function AddTeamMemberModal({ open, onClose, onCreated }) {
  const [inputs, setInputs] = useState({
    name: "",
    role: "",
    bio: "",
    image: "",
    tags: [],
    socials: {},
    order: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInputs({
      name: "",
      role: "",
      bio: "",
      image: "",
      tags: [],
      socials: {},
      order: "",
    });
  }, [open]);

  const handle = (k, v) => setInputs((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: inputs.name ?? "",
        role: inputs.role ?? "",
        bio: inputs.bio ?? "",
        image: inputs.image ?? "",
        tags: inputs.tags === "" ? "" : inputs.tags,
        socials: inputs.socials === "" ? "" : inputs.socials,
        order:
          inputs.order === "" || inputs.order == null
            ? ""
            : Number(inputs.order),
      };

      const res = await adminCreate("team_members", payload);
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
          <Button onClick={save} disabled={saving || !inputs.name?.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <Input
              value={inputs.name}
              onChange={(e) => handle("name", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <Input
              value={inputs.role}
              onChange={(e) => handle("role", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Bio</span>
            <Textarea
              rows={4}
              value={inputs.bio}
              onChange={(e) => handle("bio", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">
              Image (url/filename)
            </span>
            <Input
              value={inputs.image}
              onChange={(e) => handle("image", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Order</span>
            <Input
              type="number"
              value={inputs.order}
              onChange={(e) =>
                handle(
                  "order",
                  e.target.value === "" ? "" : e.target.valueAsNumber
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Add/Edit modal ---------- */
function EditModal({ open, onClose, collection, row, onSaved }) {
  const cfg = FIELD_CONFIG[collection];
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [relationsCache, setRelationsCache] = useState({});
  const [addUserOpen, setAddUserOpen] = useState(false);

  // detect actual members field for this record while editing a team
  const membersKey =
    collection === "teams" ? pickMembersFieldFromRecord(inputs || row) : null;

  useEffect(() => {
    setInputs(row ?? {});
  }, [row, open]);

  useEffect(() => {
    (async () => {
      const relKeys = (cfg?.formFields || []).filter(
        (f) => f.type === "relation" || f.type === "multirelation"
      );

      const entries = await Promise.all(
        relKeys.map(async (f) => [
          f.key,
          await fetchOptions(f.collection, f.display),
        ])
      );

      const map = {};
      entries.forEach(([k, v]) => (map[k] = v));

      // Teams members can be either `members` or `team_menbers`; cache options under both keys
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

    // update local UI immediately
    handleChange(key, next);

    // persist immediately if editing existing team
    if (collection === "teams" && row?.id) {
      await adminUpdate("teams", row.id, { [key]: next });
      onSaved?.();
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload = {};

      for (const f of cfg.formFields) {
        // Special-case: teams "Members" field - write to detected key
        if (
          collection === "teams" &&
          f.type === "multirelation" &&
          f.collection === "team_members"
        ) {
          const key = membersKey || MEMBERS_FIELD_CANDIDATES[0];
          const v = inputs?.[key] ?? inputs?.[f.key];
          payload[key] = Array.isArray(v) ? v : [];
          continue;
        }

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-5 w-5 cursor-pointer" onClick={onClose} />
            <h2 className="text-lg font-semibold">
              {row?.id ? "Edit" : "Add"} {collection}
            </h2>
          </div>
          <Button onClick={save} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cfg.formFields.map((f) => {
            let v = inputs?.[f.key];
            if (f.type === "datetime") v = toDatetimeLocal(v);

            // existing special-case: included tests selector
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

            // ✅ Teams Members block with "Add User" (auto-detect members key)
            if (
              collection === "teams" &&
              f.type === "multirelation" &&
              f.collection === "team_members"
            ) {
              const key = membersKey || MEMBERS_FIELD_CANDIDATES[0];
              const opts = relationsCache[key] || [];
              const curr = Array.isArray(inputs?.[key]) ? inputs[key] : [];

              return (
                <div key={f.key} className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">
                      {f.label}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAddUserOpen(true)}
                      className="border border-slate-200"
                    >
                      <Plus className="h-4 w-4" />
                      Add User
                    </Button>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-2">
                    <div className="flex flex-wrap gap-2">
                      {opts.map((o) => {
                        const checked = curr.includes(o.id);
                        return (
                          <label
                            key={o.id}
                            className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
                              checked
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200"
                            }`}
                          >
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
                </div>
              );
            }

            return (
              <label key={f.key} className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">{f.label}</span>

                {f.type === "text" && (
                  <Input
                    value={v ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                  />
                )}

                {f.type === "number" && (
                  <Input
                    type="number"
                    value={v ?? ""}
                    onChange={(e) =>
                      handleChange(
                        f.key,
                        e.target.value === "" ? "" : e.target.valueAsNumber
                      )
                    }
                  />
                )}

                {f.type === "textarea" && (
                  <Textarea
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
                  <Input
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

        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Table + actions ---------- */
function CollectionView({ collection }) {
  const cfg = FIELD_CONFIG[collection];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(undefined);
  const [page, setPage] = useState(1);

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
          : collection === "pages"
          ? "parent"
          : collection === "teams"
          ? MEMBERS_FIELD_CANDIDATES.join(",") // ✅ expand BOTH: "members,team_menbers"
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
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              className="pl-8"
            />
          </div>
          <Button variant="ghost" onClick={() => load(1)}>
            Refresh
          </Button>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add New
        </Button>
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
                        {h.render ? h.render(row) : row[h.key] ?? "—"}
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

/* ---------- Main Admin Panel ---------- */
const AdminPanel = () => {
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

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[520px] gap-5">
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
                onClick={() => setActive(m.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium ${activeCls}`}
              >
                {m.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {MENU.find((m) => m.key === active)?.label}
          </h1>
        </div>
        <CollectionView collection={active} />
      </main>
    </div>
  );
};

export default AdminPanel;
