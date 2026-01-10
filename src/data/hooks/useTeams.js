import { useEffect, useState } from "react";
import { fetchTeams } from "@/data/teams";

export function useTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    fetchTeams()
      .then((t) => alive && setTeams(t))
      .catch((e) => alive && setError(e.message || "Failed to load teams"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return { teams, loading, error };
}
