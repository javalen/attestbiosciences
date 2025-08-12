import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import pb from "@/db/pocketbase";

function clampRating(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

export default function TestimonialNew() {
  const navigate = useNavigate();
  const loggedIn = pb.authStore.isValid && !!pb.authStore.model;

  // redirect to login if not authenticated
  useEffect(() => {
    if (!loggedIn) {
      navigate("/login", { state: { redirectTo: "/testimonials/new" } });
    }
  }, [loggedIn, navigate]);

  const [name, setName] = useState(
    pb.authStore.model?.name ||
      `${pb.authStore.model?.fname ?? ""} ${
        pb.authStore.model?.lname ?? ""
      }`.trim() ||
      pb.authStore.model?.email?.split("@")[0] ||
      ""
  );
  const [role, setRole] = useState("Patient");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append("name", name.trim() || "Anonymous");
      form.append("role", role.trim() || "Patient");
      form.append("rating", String(clampRating(rating)));
      form.append("content", content.trim());
      if (imageFile) form.append("image", imageFile); // if `image` is a file field

      // If your collection uses a `published` flag, you can default to false:
      // form.append("published", "false");

      await pb.collection("testimonial").create(form);

      setSuccess("Thanks! Your testimonial has been submitted.");
      // optional: wait a moment then go back to the carousel
      setTimeout(() => navigate("/#testimonials"), 800);
    } catch (err) {
      setError(err?.message || "Could not submit testimonial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-[70vh] bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-sky-900">
            Share Your Experience
          </h1>
          <Link to="/#testimonials" className="text-sky-700 hover:underline">
            Back to testimonials
          </Link>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <div className="text-sm">{success}</div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 grid gap-5"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ahmed Mohamed"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use your preferred display name.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Patient"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Rating
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v} star{v > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Your story
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Tell us about your experience…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Photo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:text-slate-700 hover:file:bg-slate-50"
            />
            <p className="mt-1 text-xs text-slate-500">
              Square image looks best (e.g. 320×320).
            </p>
          </div>

          <button
            disabled={submitting || !content.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2.5 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit testimonial
          </button>
        </form>
      </div>
    </section>
  );
}
