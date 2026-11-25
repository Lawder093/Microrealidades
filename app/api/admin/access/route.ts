import { editorialAccess } from "@/lib/ecosystem-server";
import { accessFailure, identityRpc } from "@/lib/micro-id-server";
export async function GET(request: Request) {
  try {
    const {token}=await editorialAccess(request);
    return Response.json({canWrite:true,canPublish:await identityRpc(token,"micro_has_editorial",{p_permission:"publish"})},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {return accessFailure(error);}
}
