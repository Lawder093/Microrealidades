import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publications } from "@/lib/publications";

export const metadata = {
  title: "Publicaciones — Microrealidades",
  description: "Notas, conversaciones y herramientas para pensar las realidades que habitamos.",
};

export default function PublicationsPage() {
  return (
    <main className="inner-page publications-page">
      <SiteHeader compact />
      <section className="page-intro" aria-labelledby="publications-title">
        <p className="section-label">[ 03 ] &nbsp; Publicaciones</p>
        <h1 id="publications-title">Pensar en<br /><em>voz alta.</em></h1>
        <p>Un espacio editorial para compartir notas de campo, conversaciones y herramientas que acompañen otros procesos.</p>
      </section>
      <section className="publication-section" aria-label="Publicaciones">
        <div className="publication-list">
          {publications.map((publication) => (
            <article className={`publication-card ${publication.color}`} key={publication.number}>
              <div className="publication-meta"><span>{publication.number}</span><span>{publication.category}</span></div>
              <h2>{publication.title}</h2><p>{publication.excerpt}</p>
              <small>{publication.date}</small>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
