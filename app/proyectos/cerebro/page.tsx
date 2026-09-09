import { BrainExperience } from "@/components/brain/brain-experience";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Microrealidades — Cerebro",
  description: "Una experiencia 3D para observar el pensamiento en movimiento.",
};

export default function BrainProjectPage() {
  return (
    <main className="inner-page brain-page">
      <SiteHeader compact />
      <BrainExperience />
      <SiteFooter />
    </main>
  );
}
