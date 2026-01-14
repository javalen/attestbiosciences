import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Linkedin,
  Mail,
  Globe,
  Twitter,
} from "lucide-react";

// shadcn/ui components (assumed available in your project)
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AdvisoryTeam from "./AdvisoryTeam";

// ✅ New data layer import (adjust path if your file differs)
import { fetchTeams } from "@/data/teams";

/**
 * API expects something like:
 *  GET /api/public/teams -> { teams: [{ id, title, order, members: [...] }] }
 *
 * Member shape expected by this UI:
 *  {
 *    id, name, role, bio,
 *    image | imageUrl,
 *    tags, socials, order
 *  }
 */

function initials(name = "") {
  const parts = String(name).split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// Keep these normalizers because JSON fields might be stringified depending on server/PB
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

function normalizeTags(val) {
  const parsed = safeJson(val, []);
  if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  if (typeof parsed === "string") return [parsed].filter(Boolean);
  return [];
}

function normalizeSocials(val) {
  const parsed = safeJson(val, null);
  if (!parsed || typeof parsed !== "object") return null;

  const linkedin = parsed.linkedin || parsed.linkedIn || parsed.li;
  const twitter = parsed.twitter || parsed.x;
  const website = parsed.website || parsed.web || parsed.url;
  const email = parsed.email;

  const out = {
    ...(linkedin ? { linkedin: String(linkedin) } : {}),
    ...(twitter ? { twitter: String(twitter) } : {}),
    ...(website ? { website: String(website) } : {}),
    ...(email ? { email: String(email) } : {}),
  };

  return Object.keys(out).length ? out : null;
}

function SocialLinks({ socials }) {
  if (!socials) return null;
  const { linkedin, twitter, website, email } = socials;

  return (
    <div className="flex items-center gap-2">
      {linkedin && (
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="hover:scale-105 transition"
        >
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        </Button>
      )}
      {twitter && (
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="hover:scale-105 transition"
        >
          <a
            href={twitter}
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter/X"
          >
            <Twitter className="h-4 w-4" />
          </a>
        </Button>
      )}
      {website && (
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="hover:scale-105 transition"
        >
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            aria-label="Website"
          >
            <Globe className="h-4 w-4" />
          </a>
        </Button>
      )}
      {email && (
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="hover:scale-105 transition"
        >
          <a href={`mailto:${email}`} aria-label="Email">
            <Mail className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}

function MemberCard({ m, onMemberClick }) {
  const img = m.imageUrl || m.image || "";

  return (
    <div>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Card className="h-full rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-primary/10">
              <AvatarImage src={img} alt={m.name} />
              <AvatarFallback>{initials(m.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-tight truncate">
                {m.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{m.role}</p>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {m.bio}
            </p>

            {Array.isArray(m.tags) && m.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.tags.map((t, i) => (
                  <Badge
                    key={`${m.id}-tag-${i}`}
                    variant="secondary"
                    className="rounded-full"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <SocialLinks socials={m.socials} />
            {onMemberClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMemberClick(m)}
              >
                View Profile
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

function TeamAccordion({ label, open, onToggle, children }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/70 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-black/[0.03] transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-semibold truncate">{label}</span>
        </div>

        <span className="text-xs text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="px-5 pb-5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TeamSection({
  title = "Meet the Team",
  onMemberClick,
}) {
  const [teams, setTeams] = useState([]); // [{ id, title, order, members: TeamMember[] }]
  const [openTeamIds, setOpenTeamIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Use new data layer (server API), NOT PocketBase client in browser
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const apiTeamsRaw = await fetchTeams(); // should return array of teams

        const normalized = (Array.isArray(apiTeamsRaw) ? apiTeamsRaw : [])
          .map((t) => {
            const members = (Array.isArray(t.members) ? t.members : [])
              .map((m) => ({
                id: m.id,
                name: m.name || "",
                role: m.role || "",
                bio: m.bio || "",
                // API might return imageUrl; we support both
                imageUrl: m.imageUrl || m.image || "",
                tags: normalizeTags(m.tags),
                socials: normalizeSocials(m.socials),
                order: Number(m.order ?? 0),
              }))
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return {
              id: t.id,
              title: t.title || "Team",
              order: Number(t.order ?? 0),
              members,
            };
          })
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        if (!alive) return;

        setTeams(normalized);

        // Optional: auto-open first team
        if (normalized.length) {
          setOpenTeamIds((prev) => {
            if (prev.size) return prev;
            return new Set([normalized[0].id]);
          });
        }
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load team data.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const totalMembers = useMemo(
    () => teams.reduce((sum, t) => sum + (t.members?.length || 0), 0),
    [teams]
  );

  const toggleTeam = (teamId) => {
    setOpenTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  return (
    <section id="team" className="scroll-mt-20 bg-sky-50 py-16 px-6 sm:px-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : ``}
        </p>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-sm text-muted-foreground">Loading teams…</div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Teams (collapsible) */}
      {!loading && !error && (
        <div className="space-y-4">
          {teams.map((t) => {
            const open = openTeamIds.has(t.id);
            return (
              <TeamAccordion
                key={t.id}
                label={t.title}
                open={open}
                onToggle={() => toggleTeam(t.id)}
              >
                {t.members?.length ? (
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      layout
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {t.members.map((m) => (
                        <MemberCard
                          key={m.id}
                          m={m}
                          onMemberClick={onMemberClick}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No members found for this team.
                  </div>
                )}
              </TeamAccordion>
            );
          })}

          {teams.length === 0 && (
            <div className="text-sm text-muted-foreground">No teams found.</div>
          )}
        </div>
      )}
    </section>
  );
}
