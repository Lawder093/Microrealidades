import { MicrohubAccess } from "@/components/microhub-access";
import { MicroAdmin } from "@/components/micro-admin";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "MicroAdmin — Microrealidades", robots: { index: false, follow: false } };

export default function RootPage() {
  return <main className="inner-page microhub-page"><SiteHeader compact /><MicrohubAccess><MicroAdmin /></MicrohubAccess><SiteFooter /></main>;
}
