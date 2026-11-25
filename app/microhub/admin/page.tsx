import { MicrohubAccess } from "@/components/microhub-access";
import { RootDashboard } from "@/components/admin/root-dashboard";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Super root — Microhub", robots: { index: false, follow: false } };

export default function RootPage() {
  return <main className="inner-page microhub-page"><SiteHeader compact /><MicrohubAccess><RootDashboard /></MicrohubAccess><SiteFooter /></main>;
}
