import {
  accessFailure,
  identityRpc,
  identityUser,
} from "@/lib/micro-id-server";
export async function GET(request: Request) {
  try {
    const { token } = await identityUser(request);
    return Response.json(await identityRpc(token, "micro_context"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return accessFailure(error);
  }
}
