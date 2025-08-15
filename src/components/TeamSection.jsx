import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  ArrowUpDown,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import rion from "../assets/Rion.jpg";
import antionette from "../assets/dr_an.jpg";
import marcus from "../assets/marcus.png";
import alexis from "../assets/alexis.png";
import board from "../assets/board.png";
import AdvisoryTeam from "./AdvisoryTeam";

/*
  TeamSection — Modern, filterable team grid

  Props:
    - team?: TeamMember[]  // Optional. If not provided, a demo team renders.
    - title?: string       // Optional. Title above the grid.
    - onMemberClick?: (m: TeamMember) => void // Optional callback when clicking “View Profile”.

  TeamMember shape:
    {
      id: string | number,
      name: string,
      role: string,
      bio: string,
      image?: string,
      tags?: string[],
      socials?: { linkedin?: string; twitter?: string; website?: string; email?: string }
    }

  Notes:
    - Uses Tailwind + shadcn/ui + framer-motion + lucide-react.
    - Add/remove controls (search, role filter, sort) to fit your app.
*/

const demoTeam = [
  {
    id: 1,
    name: "Rion Barnes, Esq.",
    role: "CEO & General Counsel",
    bio: "Rion Barnes, Esq. is the CEO and General Counsel of Attest BioSciences, bringing a strategic vision and strong legal acumen to the company. With a background working in the legal departments of Fortune 500 and 100 companies, including Morgan Stanley and Univar Solutions, Rion has extensive experience navigating complex legal and corporate matters. As a co-founder, Rion has been instrumental in shaping the company's direction and growth, leveraging their expertise in corporate governance and a commitment to health innovation. Dedicated to making cancer screening more accessible and affordable, Rion leads Attest BioSciences with a focus on strategic growth and impactful legal oversight.",
    image: rion,
    tags: ["Legal", "Partnerships", "R&D"],
    socials: {
      linkedin: "https://www.linkedin.com/",
      twitter: "https://twitter.com/",
      website: "https://example.com",
      email: "maya@example.com",
    },
  },
  {
    id: 2,
    name: "Marcus Hall",
    role: "Chief of Sales and Marketing",
    bio: "Marcus Hall is the Chief of Sales and Marketing at Attest BioSciences, where he leads the company's sales strategies and brand outreach. Marcus brings a wealth of experience from his previous executive roles in sales and marketing at Fortune 500 companies, including Coca-Cola and Caterpillar. His background in working with industry giants has equipped him with a deep understanding of market dynamics and consumer engagement. Marcus is dedicated to driving Attest BioSciences' market presence and fostering strong customer relationships, leveraging his expertise to position the company as a leader in at-home cancer screening.",
    image: marcus,
    tags: ["Genomics", "Pipelines", "ML"],
    socials: {
      linkedin: "https://www.linkedin.com/",
      website: "https://example.com",
      email: "jordan@example.com",
    },
  },
  {
    id: 3,
    name: "Dr. Antoinette Gaston",
    role: "COO & Chief Scientific Officer",
    bio: "Dr. Antoinette Gaston is the COO and Chief Scientific Officer of Attest BioSciences and a co-founder of the company. She holds a Ph.D. in Molecular Biology and an MBA, combining scientific expertise with strong business acumen. With years of experience in clinical laboratory operations, cancer research, and assay development, Dr. Gaston plays a critical role in the scientific advancement of the company. She is passionate about advancing healthcare through innovative solutions and works tirelessly to ensure that Attest BioSciences delivers high-quality, reliable cancer screening tests. Her leadership and scientific expertise are vital to the company's mission of empowering proactive health management and making proactive health management accessible to all.",
    image: antionette,
    tags: ["CLIA", "Quality", "Validation"],
    socials: {
      linkedin: "https://www.linkedin.com/",
      email: "amina@example.com",
    },
  },
];

function initials(name = "") {
  const parts = name.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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
          href={`mailto:${email}`}
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
  return (
    <div className="">
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className=""
      >
        <Card className="h-full rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-primary/10">
              <AvatarImage src={m.image} alt={m.name} />
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
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {m.bio}
            </p>
            {Array.isArray(m.tags) && m.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.tags.map((t, i) => (
                  <Badge key={i} variant="secondary" className="rounded-full">
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

export default function TeamSection({
  team = demoTeam,
  title = "Meet the Team",
  onMemberClick,
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [sort, setSort] = useState("name-asc");

  const roles = useMemo(() => {
    const all = Array.from(new Set(team.map((t) => t.role))).sort();
    return ["All", ...all];
  }, [team]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = team.filter((m) => {
      const matchesRole = role === "All" || m.role === role;
      const hay = `${m.name} ${m.role} ${m.bio} ${(m.tags || []).join(
        " "
      )}`.toLowerCase();
      const matchesQuery = q.length === 0 || hay.includes(q);
      return matchesRole && matchesQuery;
    });

    switch (sort) {
      case "name-desc":
        list = list.sort((a, b) => a.name.localeCompare(b.name) * -1);
        break;
      case "role":
        list = list.sort((a, b) => a.role.localeCompare(b.role));
        break;
      case "name-asc":
      default:
        list = list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [team, query, role, sort]);

  return (
    <section id="team" className="scroll-mt-20 bg-sky-50 py-16 p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">
              Executive Team
            </h2>
          </div>
        </div>

        {/* Controls */}
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((m) => (
            <MemberCard key={m.id} m={m} onMemberClick={onMemberClick} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          No team members match your search.
        </div>
      )}
      <AdvisoryTeam />
    </section>
  );
}
