import { MicrohubAccess } from "@/components/microhub-access";
import { MicroIdAccount } from "@/components/micro-id-account";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata = { title: "MicroID — Microrealidades", robots: { index: false } };
export default function IdentityPage() {
  return <main className="inner-page"><SiteHeader compact /><MicrohubAccess><MicroIdAccount /></MicrohubAccess><SiteFooter /></main>;
}
