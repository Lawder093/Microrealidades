import Link from "next/link";
import { blogDate, type BlogSummary } from "@/lib/blog";

export function PublicationCards({
  posts,
  offset = 0,
}: {
  posts: BlogSummary[];
  offset?: number;
}) {
  return posts.map((post, index) => (
    <Link
      prefetch={false}
      href={`/publicaciones/${post.slug}`}
      className={`publication-card ${post.color}`}
      key={post.id}
    >
      <div className="publication-meta">
        <span>{String(offset + index + 1).padStart(2, "0")}</span>
        <span>{post.category}</span>
      </div>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
      <small>{blogDate(post.published_at)}</small>
    </Link>
  ));
}
