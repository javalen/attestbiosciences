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

/* ---------- Menu ---------- */
const MENU = [
  { key: "ws_users", label: "Users" },
  { key: "test", label: "Tests" },
  { key: "test_category", label: "Test Categories" },
  { key: "cart", label: "Carts" },
  { key: "testimonial", label: "Testimonials" },
];

/* ---------- Field configuration ---------- */
const FIELD_CONFIG = {
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

  test_category: {
    listColumns: [
      { key: "name", header: "Name" },
      { key: "updated", header: "Updated" },
    ],
    formFields: [{ key: "name", label: "Name", type: "text" }],
  },

  test: {
    listColumns: [
      { key: "name", header: "Name" },
      {
        key: "cat_id",
        header: "Category",
        render: (r) => r?.expand?.cat_id?.name ?? "—",
      },
      {
        key: "cost",
        header: "Cost",
        render: (r) => formatUSD(r?.cost),
      },
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
      // custom-rendered table in modal
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
      { key: "image", label: "Image", type: "file" },
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
  const list = await pb
    .collection(collection)
    .getList(1, 500, { sort: "name" });
  return list.items.map((i) => {
    const path = display.split(".");
    let label = i;
    path.forEach((k) => (label = label?.[k]));
    return { id: i.id, label: label ?? i.id };
  });
}

/* ---------- Add/Edit modal ---------- */
function EditModal({ open, onClose, collection, row, onSaved }) {
  const cfg = FIELD_CONFIG[collection];
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [relationsCache, setRelationsCache] = useState({});

  useEffect(() => {
    setInputs(row ?? {});
  }, [row, open]);

  useEffect(() => {
    (async () => {
      const relKeys = cfg.formFields.filter(
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
      setRelationsCache(map);
    })();
  }, [collection, open]); // eslint-disable-line

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

  //   const save = async () => {
  //     setLoading(true);
  //     try {
  //       const formData = new FormData();
  //       for (const f of cfg.formFields) {
  //         const v = inputs[f.key];
  //         if (f.type === "file") {
  //           if (v instanceof File) formData.append(f.key, v);
  //           continue;
  //         }
  //         if (f.type === "checkbox") formData.append(f.key, v ? "true" : "false");
  //         else if (f.type === "multirelation")
  //           formData.append(f.key, Array.isArray(v) ? v.join(",") : "");
  //         else formData.append(f.key, v ?? "");
  //       }
  //       const coll = pb.collection(collection);
  //       const saved = row?.id
  //         ? await coll.update(row.id, formData)
  //         : await coll.create(formData);
  //       onSaved(saved);
  //       onClose();
  //     } catch (e) {
  //       alert(e?.message ?? "Save failed");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const save = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      for (const f of cfg.formFields) {
        const v = inputs[f.key];

        if (f.type === "file") {
          if (v instanceof File) formData.append(f.key, v);
          continue;
        }

        if (f.type === "checkbox") {
          formData.append(f.key, v ? "true" : "false");
          continue;
        }

        if (f.type === "multirelation") {
          // PB expects multiple entries with the same key in multipart form:
          // included_test=ID1&included_test=ID2&...
          const arr = Array.isArray(v) ? v.filter(Boolean) : [];
          if (arr.length) {
            arr.forEach((id) => formData.append(f.key, id));
          } else {
            // Explicitly clear when empty (PB accepts empty string to clear)
            formData.append(f.key, "");
          }
          continue;
        }

        if (f.type === "relation") {
          // Single relation: send the id or empty string to clear
          formData.append(f.key, v ?? "");
          continue;
        }

        // Plain fields
        formData.append(f.key, v ?? "");
      }

      const coll = pb.collection(collection);
      const saved = row?.id
        ? await coll.update(row.id, formData)
        : await coll.create(formData);
      onSaved(saved);
      onClose();
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
            const v = inputs?.[f.key];

            // Custom: Included Tests as scrollable checkbox table (only when top_level_test is checked)
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
                              const checked = Array.isArray(v)
                                ? v.includes(opt.id)
                                : false;
                              const disabled = row?.id && opt.id === row.id; // prevent selecting self
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
                      checked={!!v}
                      onChange={(e) => handleChange(f.key, e.target.checked)}
                    />
                  </div>
                )}

                {f.type === "file" && (
                  <Input
                    type="file"
                    onChange={(e) =>
                      handleChange(f.key, e.target.files?.[0] ?? null)
                    }
                  />
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

                {f.type === "relation" && (
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={v ?? ""}
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
          : undefined;

      const res = await pb.collection(collection).getList(pageNo, 100, {
        sort: "-updated",
        filter: buildFilter(collection, q),
        expand,
      });
      setItems(res.items);
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
    await pb.collection(collection).delete(row.id);
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

      {/* Scrollable table with sticky header */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
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
  const [active, setActive] = useState("ws_users");
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const authModel = pb.authStore.model;
        if (!authModel?.id) {
          navigate("/auth");
          return;
        }
        const me = await pb.collection("ws_users").getOne(authModel.id);
        if (!me?.isAdmin) {
          navigate("/auth");
          return;
        }
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
