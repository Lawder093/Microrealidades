"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useEcosystem } from "@/components/ecosystem-provider";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

type Organization = { id: string; name: string; status: string };
type Workspace = {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
};
type Module = {
  id: string;
  name: string;
  description: string;
  status: string;
  configuration: Record<string, unknown>;
};
type Package = {
  id: string;
  name: string;
  is_active: boolean;
  modules: string[] | null;
};
type Snapshot = {
  is_root: boolean;
  organizations: Organization[];
  workspaces: Workspace[];
  modules: Module[];
  packages: Package[];
  users: Array<{
    user_id: string;
    email: string;
    display_name: string;
    is_active: boolean;
    roles: string[];
  }>;
  memberships: Array<{
    organization_id: string;
    user_id: string;
    role: string;
    is_active: boolean;
  }>;
  contracts: Array<{
    id: string;
    organization_id: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
    modules: string[] | null;
  }>;
  payments: Array<{
    id: string;
    organization_id: string;
    amount: number;
    currency: string;
    reference: string;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    accepted_at: string | null;
    revoked_at: string | null;
    expires_at: string;
  }>;
  events: Array<{
    id: string;
    action: string;
    created_at: string;
    actor_id: string;
  }>;
};
type Command = (
  action: string,
  data: Record<string, unknown>,
  emailDelivery?: boolean,
) => Promise<void>;

function CommandForm({
  title,
  action,
  command,
  children,
}: {
  title: string;
  action: string;
  command: Command;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(form.entries());
    data.modules = form.getAll("modules");
    if (form.has("enabled")) data.enabled = form.get("enabled") === "true";
    setPending(true);
    setError("");
    try {
      for (const name of ["starts_at", "ends_at"]) {
        if (form.has(name))
          data[name] = form.get(name)
            ? new Date(String(form.get(name))).toISOString()
            : null;
      }
      if (form.has("configuration"))
        data.configuration = JSON.parse(
          String(form.get("configuration") || "{}"),
        );
      await command(action, data, form.get("email_delivery") === "on");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "No se pudo guardar.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="ecosystem-admin-form">
      <h2>{title}</h2>
      <form className="root-blog-form" onSubmit={submit}>
        <fieldset disabled={pending}>
          <div className="root-form-grid">{children}</div>
          {error && (
            <p className="super-battery-error" role="alert">
              {error}
            </p>
          )}
          <button className="publication-primary-action" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

function InstitutionFields({
  snapshot,
  workspace = false,
  optional = false,
}: {
  snapshot: Snapshot;
  workspace?: boolean;
  optional?: boolean;
}) {
  const [selected, setSelected] = useState("");
  const organization = selected || snapshot.organizations[0]?.id || "";
  return (
    <>
      <label>
        Institución
        <select
          required={!optional}
          name="organization_id"
          value={organization}
          onChange={(event) => setSelected(event.target.value)}
        >
          {snapshot.organizations.map((entry) => (
            <option value={entry.id} key={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>
      {workspace && (
        <label>
          Espacio de trabajo
          <select required={!optional} name="workspace_id" key={organization}>
            {snapshot.workspaces
              .filter((entry) => entry.organization_id === organization)
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
          </select>
        </label>
      )}
    </>
  );
}

function EnabledField({ initial = true }: { initial?: boolean }) {
  return (
    <label>
      Estado
      <select name="enabled" defaultValue={String(initial)}>
        <option value="true">Activo</option>
        <option value="false">Suspendido</option>
      </select>
    </label>
  );
}

function ModuleFields({
  modules,
  selected = [],
}: {
  modules: Module[];
  selected?: string[];
}) {
  return (
    <fieldset className="ecosystem-module-options root-field-wide">
      <legend>Módulos</legend>
      {modules.map((module) => (
        <label key={module.id}>
          <input
            type="checkbox"
            name="modules"
            value={module.id}
            defaultChecked={selected.includes(module.id)}
          />
          {module.name}
          {module.status === "coming_soon" ? " · Próximamente" : ""}
        </label>
      ))}
    </fieldset>
  );
}

function InviteFields({ snapshot }: { snapshot: Snapshot }) {
  const [scope, setScope] = useState("institution");
  return (
    <>
      {snapshot.is_root && (
        <label>
          Ámbito
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          >
            <option value="institution">Institucional</option>
            <option value="editorial">Editorial</option>
          </select>
        </label>
      )}
      <label>
        Correo de la persona
        <input name="email" type="email" required />
      </label>
      {scope === "institution" ? (
        <>
          <InstitutionFields snapshot={snapshot} workspace />
          <label>
            Rol
            <select name="role">
              <option value="professional">Profesional</option>
              <option value="member">Usuario institucional</option>
              {snapshot.is_root && (
                <option value="institution_admin">
                  Administrador institucional
                </option>
              )}
            </select>
          </label>
        </>
      ) : (
        <label>
          Rol editorial
          <select name="role">
            <option value="author">Autor</option>
            <option value="editor">Editor</option>
          </select>
        </label>
      )}
      <label className="root-checkbox">
        <input name="email_delivery" type="checkbox" />
        Enviar invitación por correo
      </label>
    </>
  );
}

function ContractFields({ snapshot }: { snapshot: Snapshot }) {
  const [kind, setKind] = useState("paid");
  return (
    <>
      <InstitutionFields snapshot={snapshot} />
      <label>
        Modalidad
        <select
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
        >
          <option value="paid">Pago externo</option>
          <option value="trial">Prueba autorizada</option>
        </select>
      </label>
      <label>
        Paquete
        <select name="package_id">
          <option value="">Módulos individuales</option>
          {snapshot.packages
            .filter((entry) => entry.is_active)
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
        </select>
      </label>
      {kind === "paid" && (
        <>
          <label>
            Importe pagado
            <input
              required
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
            />
          </label>
          <label>
            Moneda
            <input
              name="currency"
              required
              defaultValue="MXN"
              minLength={3}
              maxLength={3}
            />
          </label>
          <label>
            Referencia externa
            <input name="reference" required maxLength={200} />
          </label>
        </>
      )}
      <label>
        Inicio
        <input name="starts_at" type="datetime-local" />
      </label>
      <label>
        Fin de vigencia
        <input name="ends_at" type="datetime-local" />
      </label>
      <ModuleFields modules={snapshot.modules} />
    </>
  );
}

async function fetchSnapshot(
  authFetch: (url: string, init?: RequestInit) => Promise<Response>,
  root: boolean,
  organizationId: string,
): Promise<Snapshot> {
  const query =
    !root && organizationId ? `?organization_id=${organizationId}` : "";
  const response = await authFetch(`/api/ecosystem/admin${query}`);
  const value = (await response.json()) as Snapshot & { error?: string };
  if (!response.ok)
    throw new Error(value.error || "No se pudo cargar MicroAdmin.");
  return value;
}

export function MicroAdmin() {
  const {
    data: context,
    workspaceId,
    reload,
    error: contextError,
    loading,
  } = useEcosystem();
  const { authFetch } = useMicrohubAuth();
  const root = Boolean(context?.permissions.superadmin);
  const administrable =
    context?.organizations.filter(
      (entry) => entry.role === "institution_admin",
    ) ?? [];
  const currentOrg = context?.workspaces.find(
    (entry) => entry.id === workspaceId,
  )?.organization_id;
  const [selectedOrg, setSelectedOrg] = useState("");
  const organizationId =
    selectedOrg ||
    administrable.find((entry) => entry.id === currentOrg)?.id ||
    administrable[0]?.id ||
    "";
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState("institutions");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  async function load() {
    const value = await fetchSnapshot(authFetch, root, organizationId);
    setSnapshot(value);
    setError("");
  }
  const ready = Boolean(context);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void fetchSnapshot(authFetch, root, organizationId)
      .then((value) => {
        if (active) {
          setSnapshot(value);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (active)
          setError(
            failure instanceof Error ? failure.message : "No se pudo cargar.",
          );
      });
    return () => {
      active = false;
    };
  }, [authFetch, root, organizationId, ready]);

  const command: Command = async (action, data, emailDelivery) => {
    const response = await authFetch("/api/ecosystem/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data, emailDelivery }),
    });
    const result = (await response.json()) as {
      error?: string;
      link?: string;
      message?: string;
      already_recorded?: boolean;
    };
    if (!response.ok) throw new Error(result.error || "No se pudo guardar.");
    setMessage(
      result.message ||
        (result.already_recorded
          ? "Este pago ya estaba registrado."
          : "Cambio guardado."),
    );
    if (result.link) setLink(result.link);
    await load();
    await reload();
  };
  function change(action: string, data: Record<string, unknown>) {
    void command(action, data).catch((failure: unknown) =>
      setError(
        failure instanceof Error ? failure.message : "No se pudo guardar.",
      ),
    );
  }

  if (!context)
    return (
      <section className="hub-section" aria-busy={loading}>
        <p role="status">
          {contextError || "Consultando permisos de administración…"}
        </p>
        {contextError && (
          <button className="section-link" onClick={() => void reload()}>
            Reintentar
          </button>
        )}
      </section>
    );
  if (!root && !administrable.length)
    return (
      <section className="hub-section">
        <h2>
          Acceso <em>restringido.</em>
        </h2>
        <Link className="section-link" href="/microhub">
          Volver a MicroHub
        </Link>
      </section>
    );
  if (!snapshot)
    return (
      <section className="hub-section">
        <p role="status">{error || "Cargando MicroAdmin…"}</p>
        <button
          className="section-link"
          onClick={() =>
            void load().catch((failure: unknown) => setError(String(failure)))
          }
        >
          Reintentar
        </button>
      </section>
    );
  const organizationName = (id: string) =>
    snapshot.organizations.find((entry) => entry.id === id)?.name ?? id;
  return (
    <section className="root-dashboard hub-section">
      <div className="root-dashboard-heading">
        <div>
          <p className="section-label">MicroAdmin</p>
          <h1>
            Administrar el <em>ecosistema.</em>
          </h1>
        </div>
        <div className="root-actions">
          <Link className="section-link" href="/microhub">
            MicroHub ↗
          </Link>
          {context.permissions.author && (
            <Link className="section-link" href="/publicaciones/gestor">
              Gestor editorial ↗
            </Link>
          )}
        </div>
      </div>
      {!root && (
        <label className="ecosystem-workspace">
          Institución
          <select
            value={organizationId}
            onChange={(event) => setSelectedOrg(event.target.value)}
          >
            {administrable.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="root-actions ecosystem-tabs">
        {[
          ["institutions", "Instituciones"],
          ["users", "Usuarios"],
          ...(root
            ? [
                ["services", "Servicios"],
                ["catalog", "Catálogo"],
              ]
            : []),
          ["invitations", "Invitaciones"],
          ["activity", "Actividad"],
        ].map(([id, title]) => (
          <button
            className="super-battery-small-action"
            aria-pressed={tab === id}
            key={id}
            onClick={() => setTab(id)}
          >
            {title}
          </button>
        ))}
      </div>
      <p role="status">{message}</p>
      {error && (
        <p className="super-battery-error" role="alert">
          {error}
        </p>
      )}
      {link && (
        <div className="root-blog-form">
          <label>
            Enlace de invitación
            <input
              readOnly
              value={link}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
          <button
            className="section-link"
            onClick={() =>
              void navigator.clipboard.writeText(link).then(
                () => setMessage("Enlace copiado."),
                () => setMessage("Selecciona el enlace para copiarlo."),
              )
            }
          >
            Copiar enlace
          </button>
        </div>
      )}
      {tab === "institutions" && (
        <>
          {root && (
            <CommandForm
              title="Crear institución"
              action="organization.create"
              command={command}
            >
              <label>
                Nombre
                <input name="name" required maxLength={160} />
              </label>
            </CommandForm>
          )}
          {snapshot.organizations.map((entry) => (
            <article className="root-post-row" key={entry.id}>
              <div>
                <h3>{entry.name}</h3>
                <p>{entry.status === "active" ? "Activa" : "Suspendida"}</p>
              </div>
              {root && (
                <button
                  className="super-battery-small-action"
                  onClick={() =>
                    change("organization.update", {
                      organization_id: entry.id,
                      status:
                        entry.status === "active" ? "suspended" : "active",
                    })
                  }
                >
                  {entry.status === "active"
                    ? "Suspender institución"
                    : "Reactivar institución"}
                </button>
              )}
            </article>
          ))}
          <CommandForm
            title="Crear espacio de trabajo"
            action="workspace.create"
            command={command}
          >
            <InstitutionFields snapshot={snapshot} />
            <label>
              Nombre del espacio
              <input name="name" required maxLength={160} />
            </label>
          </CommandForm>
          {snapshot.workspaces.map((entry) => (
            <article className="root-post-row" key={entry.id}>
              <p>
                {organizationName(entry.organization_id)} · {entry.name}
              </p>
              <button
                className="super-battery-small-action"
                onClick={() =>
                  change("workspace.update", {
                    id: entry.id,
                    enabled: !entry.is_active,
                  })
                }
              >
                {entry.is_active ? "Suspender espacio" : "Reactivar espacio"}
              </button>
            </article>
          ))}
        </>
      )}
      {tab === "users" && (
        <>
          <CommandForm
            title="Asignar membresía institucional"
            action="membership.set"
            command={command}
          >
            <InstitutionFields snapshot={snapshot} workspace />
            <label>
              Correo registrado
              <input name="email" type="email" required />
            </label>
            <label>
              Rol
              <select name="role">
                <option value="professional">Profesional</option>
                <option value="member">Usuario institucional</option>
                {root && (
                  <option value="institution_admin">
                    Administrador institucional
                  </option>
                )}
              </select>
            </label>
            <EnabledField />
          </CommandForm>
          {root && (
            <CommandForm
              title="Permisos editoriales"
              action="role.set"
              command={command}
            >
              <label>
                Correo registrado
                <input name="email" type="email" required />
              </label>
              <label>
                Rol
                <select name="role">
                  <option value="author">Autor</option>
                  <option value="editor">Editor</option>
                </select>
              </label>
              <EnabledField />
            </CommandForm>
          )}
          {snapshot.users.map((user) => (
            <article key={user.user_id} className="root-post-row">
              <div>
                <h3>{user.display_name || user.email}</h3>
                <p>{user.email}</p>
                <p>{user.roles.join(" · ")}</p>
                {snapshot.memberships
                  .filter((member) => member.user_id === user.user_id)
                  .map((member) => (
                    <p key={member.organization_id}>
                      {organizationName(member.organization_id)} · {member.role}{" "}
                      · {member.is_active ? "Activo" : "Suspendido"}
                    </p>
                  ))}
              </div>
              {root && user.user_id !== context.profile.user_id && (
                <button
                  className="super-battery-small-action"
                  onClick={() =>
                    change("user.status", {
                      user_id: user.user_id,
                      enabled: !user.is_active,
                    })
                  }
                >
                  {user.is_active ? "Suspender cuenta" : "Reactivar cuenta"}
                </button>
              )}
            </article>
          ))}
        </>
      )}
      {tab === "services" && root && (
        <>
          <CommandForm
            title="Registrar pago y activar servicio"
            action="contract.create"
            command={command}
          >
            <ContractFields snapshot={snapshot} />
          </CommandForm>
          <CommandForm
            title="Actualizar vigencia"
            action="contract.update"
            command={command}
          >
            <label>
              Servicio
              <select name="id" required>
                {snapshot.contracts.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {organizationName(entry.organization_id)} ·{" "}
                    {entry.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select name="status">
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </label>
            <label>
              Fin de vigencia
              <input name="ends_at" type="datetime-local" />
            </label>
          </CommandForm>
          <CommandForm
            title="Habilitación individual de módulos"
            action="contract.module"
            command={command}
          >
            <label>
              Servicio
              <select name="id" required>
                {snapshot.contracts.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {organizationName(entry.organization_id)} ·{" "}
                    {entry.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Módulo
              <select name="module_id">
                {snapshot.modules.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <EnabledField />
          </CommandForm>
          {snapshot.contracts.map((entry) => (
            <article key={entry.id} className="root-post-row">
              <div>
                <h3>{organizationName(entry.organization_id)}</h3>
                <p>
                  {entry.modules?.join(" · ")} · {entry.status}
                </p>
                <p>
                  {new Date(entry.starts_at).toLocaleDateString("es-MX")} —{" "}
                  {entry.ends_at
                    ? new Date(entry.ends_at).toLocaleDateString("es-MX")
                    : "Vigencia abierta"}
                </p>
              </div>
              <button
                className="super-battery-small-action"
                onClick={() =>
                  change("contract.update", {
                    id: entry.id,
                    status: entry.status === "active" ? "suspended" : "active",
                  })
                }
              >
                {entry.status === "active"
                  ? "Suspender servicio"
                  : "Reactivar servicio"}
              </button>
            </article>
          ))}
          <h2>Pagos externos</h2>
          {snapshot.payments.map((entry) => (
            <p key={entry.id}>
              {organizationName(entry.organization_id)} · {entry.reference} ·{" "}
              {entry.amount} {entry.currency}
            </p>
          ))}
        </>
      )}
      {tab === "catalog" && root && (
        <>
          <CommandForm
            key={editingPackage?.id ?? "new-package"}
            title={editingPackage ? "Editar paquete" : "Crear paquete"}
            action="package.save"
            command={command}
          >
            {editingPackage && (
              <input name="id" type="hidden" value={editingPackage.id} />
            )}
            <label>
              Nombre del paquete
              <input
                name="name"
                required
                defaultValue={editingPackage?.name ?? ""}
              />
            </label>
            <EnabledField initial={editingPackage?.is_active} />
            <ModuleFields
              modules={snapshot.modules}
              selected={editingPackage?.modules ?? []}
            />
          </CommandForm>
          {editingPackage && (
            <button
              className="section-link"
              onClick={() => setEditingPackage(null)}
            >
              Nuevo paquete
            </button>
          )}
          {snapshot.packages.map((entry) => (
            <article key={entry.id} className="root-post-row">
              <p>
                {entry.name} · {entry.modules?.join(" · ")}
              </p>
              <button
                className="super-battery-small-action"
                onClick={() => setEditingPackage(entry)}
              >
                Editar paquete
              </button>
            </article>
          ))}
          <CommandForm
            key={editingModule?.id ?? "new-module"}
            title={editingModule ? "Editar módulo" : "Añadir módulo"}
            action="module.save"
            command={command}
          >
            <label>
              Identificador
              <input
                name="id"
                required
                pattern="[a-z][a-z0-9_-]+"
                defaultValue={editingModule?.id ?? ""}
                readOnly={Boolean(editingModule)}
              />
            </label>
            <label>
              Nombre
              <input
                name="name"
                required
                defaultValue={editingModule?.name ?? ""}
              />
            </label>
            <label>
              Descripción
              <textarea
                name="description"
                required
                defaultValue={editingModule?.description ?? ""}
              />
            </label>
            <label>
              Disponibilidad
              <select
                name="status"
                defaultValue={editingModule?.status ?? "coming_soon"}
              >
                <option value="coming_soon">Próximamente</option>
                <option value="active">Activo</option>
                <option value="disabled">Deshabilitado</option>
              </select>
            </label>
            <label>
              Configuración JSON
              <textarea
                name="configuration"
                defaultValue={JSON.stringify(
                  editingModule?.configuration ?? {},
                  null,
                  2,
                )}
              />
            </label>
          </CommandForm>
          {editingModule && (
            <button
              className="section-link"
              onClick={() => setEditingModule(null)}
            >
              Nuevo módulo
            </button>
          )}
          {snapshot.modules.map((entry) => (
            <article className="root-post-row" key={entry.id}>
              <p>
                {entry.name} · {entry.status}
              </p>
              <button
                className="super-battery-small-action"
                onClick={() => setEditingModule(entry)}
              >
                Editar módulo
              </button>
            </article>
          ))}
        </>
      )}
      {tab === "invitations" && (
        <>
          <CommandForm
            title="Invitar a una persona"
            action="invitation.create"
            command={command}
          >
            <InviteFields snapshot={snapshot} />
          </CommandForm>
          {snapshot.invitations.map((entry) => (
            <article className="root-post-row" key={entry.id}>
              <div>
                <p>
                  {entry.email} · {entry.role}
                </p>
                <p>
                  {entry.accepted_at
                    ? "Aceptada"
                    : entry.revoked_at
                      ? "Revocada"
                      : new Date(entry.expires_at) < new Date()
                        ? "Expirada"
                        : "Pendiente"}
                </p>
              </div>
              {!entry.accepted_at && !entry.revoked_at && (
                <button
                  className="super-battery-small-action"
                  onClick={() => change("invitation.revoke", { id: entry.id })}
                >
                  Revocar invitación
                </button>
              )}
            </article>
          ))}
        </>
      )}
      {tab === "activity" && (
        <section>
          <h2>Actividad administrativa</h2>
          {snapshot.events.map((entry) => (
            <article className="root-post-row" key={entry.id}>
              <p>{entry.action}</p>
              <small>
                {new Date(entry.created_at).toLocaleString("es-MX")}
              </small>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
