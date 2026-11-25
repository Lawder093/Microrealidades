import { Suspense } from "react";
import { MicrohubAccess } from "@/components/microhub-access";
import { MicroInvitation } from "@/components/micro-invitation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata = {
  title: "Invitación — MicroID",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function InvitationPage() {
  return (
    <main className="inner-page">
      <SiteHeader compact />
      <MicrohubAccess>
        <Suspense fallback={<p>Cargando invitación…</p>}>
          <MicroInvitation />
        </Suspense>
      </MicrohubAccess>
      <SiteFooter />
    </main>
  );
}
