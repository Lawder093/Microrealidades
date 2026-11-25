"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { useEcosystem } from "@/components/ecosystem-provider";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

export function WorkspaceSelector() {
  const { data, workspaceId, selectWorkspace } = useEcosystem();
  if (!data?.workspaces.length) return null;
  return (
    <label className="ecosystem-workspace">
      Institución y espacio de trabajo
      <select
        value={workspaceId}
        onChange={(event) => selectWorkspace(event.target.value)}
      >
        {data.workspaces.map((space) => (
          <option key={space.id} value={space.id}>
            {
              data.organizations.find((org) => org.id === space.organization_id)
                ?.name
            }{" "}
            · {space.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EcosystemNavigation() {
  const { session } = useMicrohubAuth();
  const { data } = useEcosystem();
  if (!session) return null;
  return (
    <div className="microhub-account-actions">
      <Link className="section-link" href="/micro-id">
        Mi MicroID ↗
      </Link>
      {data?.permissions.author && (
        <Link className="section-link" href="/publicaciones/gestor">
          Gestor editorial ↗
        </Link>
      )}
      {(data?.permissions.superadmin ||
        data?.organizations.some(
          (org) => org.role === "institution_admin",
        )) && (
        <Link className="section-link" href="/microhub/admin">
          MicroAdmin ↗
        </Link>
      )}
    </div>
  );
}

export function ModuleCatalog() {
  const { data, loading, error, workspaceId, reload } = useEcosystem();
  const { session } = useMicrohubAuth();
  if (!session)
    return <p>Inicia sesión para consultar tus servicios y herramientas.</p>;
  if (loading && !data)
    return <p aria-busy="true">Consultando tus servicios…</p>;
  if (error)
    return (
      <div role="status">
        <p>{error}</p>
        <button className="section-link" onClick={() => void reload()}>
          Reintentar
        </button>
      </div>
    );
  return (
    <>
      <WorkspaceSelector />
      {!data?.workspaces.length && (
        <p>
          Tu cuenta está lista. Los módulos estarán disponibles cuando una
          institución te incorpore y habilite sus servicios.
        </p>
      )}
      <div className="hub-grid">
        {data?.modules
          .filter((module) => module.status !== "disabled")
          .map((module) => {
            const allowed = data.access.some(
              (entry) =>
                entry.workspace_id === workspaceId &&
                entry.module_id === module.id &&
                entry.allowed,
            );
            const content = (
              <>
                <h2>{module.name}</h2>
                <p>{module.description}</p>
                <small>
                  {module.status === "coming_soon"
                    ? "Próximamente"
                    : allowed
                      ? "Abrir módulo ↗"
                      : "Servicio sin habilitar"}
                </small>
              </>
            );
            return allowed ? (
              <Link
                prefetch={false}
                className="hub-card"
                key={module.id}
                href={module.route}
              >
                {content}
              </Link>
            ) : (
              <article
                className="hub-card ecosystem-module-disabled"
                key={module.id}
              >
                {content}
              </article>
            );
          })}
      </div>
    </>
  );
}

export function ModuleAccess({
  moduleId,
  children,
}: {
  moduleId: string;
  children: ReactNode;
}) {
  const { data, loading, error, workspaceId } = useEcosystem();
  if (loading && !data)
    return (
      <section className="hub-section" aria-busy="true">
        Consultando acceso…
      </section>
    );
  if (
    !data?.access.some(
      (entry) =>
        entry.workspace_id === workspaceId &&
        entry.module_id === moduleId &&
        entry.allowed,
    )
  )
    return (
      <section className="hub-section">
        <h2>
          Revisa tus <em>servicios.</em>
        </h2>
        <p>
          {error ||
            "Este módulo no está habilitado para tu cuenta en el espacio seleccionado."}
        </p>
        <WorkspaceSelector />
        <Link className="section-link" href="/microhub">
          Volver a MicroHub ↗
        </Link>
      </section>
    );
  return (
    <Fragment key={workspaceId}>
      <div className="ecosystem-module-context">
        <WorkspaceSelector />
      </div>
      {children}
    </Fragment>
  );
}
