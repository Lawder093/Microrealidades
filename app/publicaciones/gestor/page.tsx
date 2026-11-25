import { MicrohubAccess } from "@/components/microhub-access";
import { RootDashboard } from "@/components/admin/root-dashboard";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata = {
  title: "Gestor editorial — Microrealidades",
  robots: { index: false, follow: false },
};
export default function EditorialPage() {
  return (
    <main className="inner-page">
      <SiteHeader compact />
      <MicrohubAccess>
        <RootDashboard />
      </MicrohubAccess>
      <SiteFooter />
    </main>
  );
}
