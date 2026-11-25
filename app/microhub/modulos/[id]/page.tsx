import { MicrohubAccess } from "@/components/microhub-access";
import { ModuleAccess } from "@/components/module-catalog";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="inner-page">
      <SiteHeader compact />
      <MicrohubAccess>
        <ModuleAccess moduleId={id}>
          <section className="hub-section">
            <h1>
              Espacio del <em>módulo.</em>
            </h1>
            <p>Servicio habilitado en el espacio seleccionado.</p>
          </section>
        </ModuleAccess>
      </MicrohubAccess>
      <SiteFooter />
    </main>
  );
}
