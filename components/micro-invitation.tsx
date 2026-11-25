"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";
import { useEcosystem } from "@/components/ecosystem-provider";
import Link from "next/link";

export function MicroInvitation() {
  const params = useSearchParams();
  const { authFetch } = useMicrohubAuth();
  const { reload } = useEcosystem();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  async function accept() {
    setPending(true);
    try {
      const response = await authFetch("/api/ecosystem/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.get("token") }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error);
      await reload();
      setAccepted(true);
      setMessage("Invitación aceptada.");
      window.history.replaceState(null, "", window.location.pathname);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo aceptar.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="hub-section">
      <h1>
        Tu invitación a <em>Microrealidades.</em>
      </h1>
      <p>Confirma tu incorporación con la cuenta que recibió la invitación.</p>
      <p role="status">{message}</p>
      {accepted ? (
        <Link className="section-link" href="/microhub">
          Continuar a MicroHub ↗
        </Link>
      ) : (
        <button
          className="publication-primary-action"
          disabled={pending}
          onClick={() => void accept()}
        >
          Aceptar invitación
        </button>
      )}
    </section>
  );
}
