import { accessFailure, identityRpc, identityUser } from "@/lib/micro-id-server";

export async function GET(request: Request) {
  try {
    const { token } = await identityUser(request);
    const data = await identityRpc(token, "micro_session_touch", { p_device: (request.headers.get("user-agent") ?? "Navegador").slice(0,160) });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessFailure(error); }
}

export async function PATCH(request: Request) {
  try {
    const { token } = await identityUser(request);
    const body = await request.json() as { action?: string; name?: string; bio?: string; sessionId?: string };
    if (body.action === "profile") await identityRpc(token,"micro_profile_update", { p_name: body.name ?? "", p_bio: body.bio ?? "" });
    else if (body.action === "revoke-session") await identityRpc(token,"micro_session_revoke", { p_session: body.sessionId });
    else if (body.action === "revoke-all") await identityRpc(token,"micro_sessions_revoke_all");
    else return Response.json({ error: "Acción desconocida." }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) { return accessFailure(error); }
}
