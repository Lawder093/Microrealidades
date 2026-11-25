import {
  accessFailure,
  AccessError,
  identityRpc,
  identityUser,
} from "@/lib/micro-id-server";

export async function GET(request: Request) {
  try {
    const { token } = await identityUser(request);
    const organization = new URL(request.url).searchParams.get(
      "organization_id",
    );
    return Response.json(
      await identityRpc(token, "micro_admin_snapshot", {
        p_org: organization || null,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return accessFailure(error);
  }
}

async function hashToken(value: string): Promise<string> {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function POST(request: Request) {
  try {
    const { token } = await identityUser(request);
    const body = (await request.json()) as {
      action?: string;
      data?: Record<string, unknown>;
      emailDelivery?: boolean;
    };
    if (!body.action || !body.data || typeof body.data !== "object")
      throw new AccessError("Completa la operación.", 400);
    const data = { ...body.data };
    let invitationToken = "";
    if (body.action === "invitation.create") {
      invitationToken = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      data.token_hash = await hashToken(invitationToken);
      data.expires_at = new Date(Date.now() + 7 * 86400000).toISOString();
    }
    const result = await identityRpc<Record<string, unknown>>(
      token,
      "micro_admin_command",
      { p_action: body.action, p_data: data },
    );
    if (!invitationToken) return Response.json(result);
    const path = `/micro-id/invitacion?token=${invitationToken}`;
    const origin = new URL(request.url).origin;
    let emailSent = false;
    if (body.emailDelivery) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const redirect = `${origin}/auth/confirm?next=${encodeURIComponent(path)}`;
        const response = await fetch(
          `${url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect)}`,
          {
            method: "POST",
            headers: { apikey: key, "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email, create_user: true }),
          },
        ).catch(() => null);
        emailSent = Boolean(response?.ok);
      }
    }
    return Response.json({
      ...result,
      link: `${origin}${path}`,
      emailSent,
      message: emailSent
        ? "Invitación enviada por correo."
        : "Invitación creada. Puedes compartir su enlace.",
    });
  } catch (error) {
    return accessFailure(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { token } = await identityUser(request);
    const body = (await request.json()) as { token?: string };
    if (!body.token || !/^[a-f0-9]{64}$/.test(body.token))
      throw new AccessError("Enlace de invitación inválido.", 400);
    return Response.json(
      await identityRpc(token, "micro_accept_invitation", {
        p_hash: await hashToken(body.token),
      }),
    );
  } catch (error) {
    return accessFailure(error);
  }
}
