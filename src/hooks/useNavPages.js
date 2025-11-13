import { useEffect, useRef, useState } from "react";
import pb from "@/db/pocketbase";

function useNavPages() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const subRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        // Server-side list rule already filters by role/publish/window.
        // We still sort by "order" then "label" as a stable fallback.
        const list = await pb.collection("pages").getList(1, 200, {
          sort: "order,label",
        });
        if (!cancelled) setLinks(list.items || []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load nav links.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Live updates (optional but nice): subscribe to collection changes and refetch
    (async () => {
      try {
        if (subRef.current) await pb.collection("pages").unsubscribe("*");
        await pb.collection("pages").subscribe("*", async (_e) => {
          // quick re-pull on any create/update/delete
          try {
            const list = await pb.collection("pages").getList(1, 200, {
              sort: "order,label",
            });
            if (!cancelled) setLinks(list.items || []);
          } catch {}
        });
        subRef.current = "*";
      } catch {
        // ignore subscription errors
      }
    })();

    return () => {
      cancelled = true;
      (async () => {
        try {
          if (subRef.current) await pb.collection("pages").unsubscribe("*");
        } catch {}
        subRef.current = null;
      })();
    };
  }, []);

  return { links, loading, err };
}

export default useNavPages;
