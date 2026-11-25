"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

export function RootDashboardLink() {
  const { session, authFetch } = useMicrohubAuth();
  const [allowedFor, setAllowedFor] = useState("");
  useEffect(() => {
    if (!session) return;
    let active = true;
    const id = session.user.id;
    void authFetch("/api/admin/access").then(async (response) => {
      const value = await response.json() as { isSuperRoot?: boolean };
      if (active) setAllowedFor(response.ok && value.isSuperRoot ? id : "");
    }).catch(() => { if (active) setAllowedFor(""); });
    return () => { active = false; };
  }, [session, authFetch]);
  return session && allowedFor === session.user.id ? <Link prefetch={false} className="section-link" href="/microhub/admin">Tu dashboard super root ↗</Link> : null;
}
