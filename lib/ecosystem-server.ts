import {
  AccessError,
  identityRest,
  identityRpc,
  identityUser,
} from "@/lib/micro-id-server";
import { isUuid, type EcosystemContext } from "@/lib/ecosystem";

export async function workspaceAccess(
  request: Request,
  moduleId = "microtalento",
) {
  const { token, user } = await identityUser(request);
  let workspaceId = request.headers.get("x-microhub-workspace") ?? "";
  if (!workspaceId) {
    const context = await identityRpc<EcosystemContext>(token, "micro_context");
    const choices = context.access.filter(
      (entry) => entry.module_id === moduleId && entry.allowed,
    );
    if (choices.length !== 1)
      throw new AccessError(
        "Selecciona un espacio de trabajo habilitado.",
        400,
      );
    workspaceId = choices[0].workspace_id;
  }
  if (!isUuid(workspaceId))
    throw new AccessError("Espacio de trabajo inválido.", 400);
  const allowed = await identityRpc<boolean>(token, "micro_can_workspace", {
    p_workspace: workspaceId,
    p_module: moduleId,
  });
  if (!allowed)
    throw new AccessError(
      "Tu cuenta o institución no tiene este módulo habilitado.",
    );
  const spaces = await identityRest<
    Array<{ id: string; organization_id: string }>
  >(
    token,
    `micro_workspaces?id=eq.${workspaceId}&select=id,organization_id&limit=1`,
  );
  if (!spaces[0]) throw new AccessError("Espacio no disponible.");
  return { token, user, workspace: spaces[0] };
}

export async function editorialAccess(
  request: Request,
  permission: "write" | "publish" = "write",
) {
  const { token, user } = await identityUser(request);
  const allowed = await identityRpc<boolean>(token, "micro_has_editorial", {
    p_permission: permission,
  });
  if (!allowed)
    throw new AccessError("Tu cuenta no tiene ese permiso editorial.");
  return { token, user };
}
