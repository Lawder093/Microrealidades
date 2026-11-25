import assert from "node:assert/strict";
import test from "node:test";
import { database, asUser, ids } from "./ecosystem-db.mjs";

test("editorial roles are independent of MicroHub and publishing requires an editor", async () => {
  const db = await database();
  const command = (action, data) =>
    asUser(db, ids.root, (tx) =>
      tx.query("select micro_admin_command($1,$2)", [
        action,
        JSON.stringify(data),
      ]),
    );
  try {
    await command("role.set", {
      email: "registered@example.invalid",
      role: "author",
    });
    await command("role.set", {
      email: "other@example.invalid",
      role: "editor",
    });
    const value = {
      slug: "original-qa",
      title: "Artículo ficticio",
      excerpt: "Resumen ficticio",
      body: "Texto ficticio",
      category: "Psicología",
      author_name: "Autor QA",
      color: "pink",
    };
    const post = (
      await asUser(db, ids.registered, (tx) =>
        tx.query(
          "insert into blog_posts(slug,title,excerpt,body,category,author_name,color)values($1,$2,$3,$4,$5,$6,$7) returning *",
          Object.values(value),
        ),
      )
    ).rows[0];
    assert.equal(post.author_user_id, ids.registered);
    assert.equal(
      (
        await asUser(db, ids.professional, (tx) =>
          tx.query("select id from blog_posts"),
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query(
          "insert into blog_posts(slug,title,excerpt,body,category,author_name,color)values('bad','bad','bad','bad','bad','bad','pink')",
        ),
      ),
    );
    await assert.rejects(
      asUser(db, ids.registered, (tx) =>
        tx.query(
          "update blog_posts set is_published=true,review_status='published',published_at=now() where id=$1",
          [post.id],
        ),
      ),
    );
    await assert.rejects(
      asUser(db, ids.registered, (tx) =>
        tx.query("update blog_posts set featured=true where id=$1", [post.id]),
      ),
    );
    await asUser(db, ids.registered, (tx) =>
      tx.query("update blog_posts set review_status='review' where id=$1", [
        post.id,
      ]),
    );
    await asUser(db, ids.other, (tx) =>
      tx.query(
        "update blog_posts set is_published=true,review_status='published',published_at=now(),featured=true where id=$1",
        [post.id],
      ),
    );
    await assert.rejects(
      asUser(db, ids.other, (tx) =>
        tx.query("update blog_posts set author_user_id=$2 where id=$1", [
          post.id,
          ids.other,
        ]),
      ),
    );
    assert.equal(
      (
        await asUser(db, ids.registered, (tx) =>
          tx.query(
            "update blog_posts set body='should not change' where id=$1 returning id",
            [post.id],
          ),
        )
      ).rows.length,
      0,
    );
    const publicRows = await db.transaction(async (tx) => {
      await tx.exec("set local role anon");
      return tx.query(
        "select id,title,author_user_id,featured from blog_posts",
      );
    });
    assert.equal(publicRows.rows.length, 1);
    const profile = await db.transaction(async (tx) => {
      await tx.exec("set local role anon");
      return tx.query("select * from micro_author_profiles where user_id=$1", [
        ids.registered,
      ]);
    });
    assert.deepEqual(Object.keys(profile.rows[0]).sort(), [
      "bio",
      "display_name",
      "user_id",
    ]);
    await command("user.status", { user_id: ids.other, enabled: false });
    await assert.rejects(
      asUser(db, ids.other, (tx) =>
        tx.query(
          "update blog_posts set is_published=false,review_status='withdrawn' where id=$1 returning id",
          [post.id],
        ),
      ).then((r) => {
        if (!r.rows.length) throw new Error("denied");
      }),
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from micro_admin_events where action like 'editorial.%'",
        )
      ).rows[0].n,
      3,
    );
  } finally {
    await db.close();
  }
});
