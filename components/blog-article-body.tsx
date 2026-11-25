import { blogParagraphs } from "@/lib/blog";

export function BlogArticleBody({ body }: { body: string }) {
  return <div className="publication-preview-body blog-article-body">{blogParagraphs(body).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}
