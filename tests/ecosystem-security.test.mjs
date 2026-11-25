import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { database, asUser, ids } from "./ecosystem-db.mjs";
import { PGlite } from "@electric-sql/pglite";

test("institution admins cannot alter commercial services, global roles or other institutions", async () => {
  const db = await database();
  const command = (user, action, data) =>
    asUser(
      db,
      user,
      async (tx) =>
        (
          await tx.query("select micro_admin_command($1,$2) value", [
            action,
            JSON.stringify(data),
          ])
        ).rows[0].value,
    );
  try {
    const a = await command(ids.root, "organization.create", { name: "QA A" });
    const b = await command(ids.root, "organization.create", { name: "QA B" });
    await command(ids.root, "membership.set", {
      organization_id: a.id,
      email: "professional@example.invalid",
      role: "institution_admin",
    });
    for (const [action, data] of [
      [
        "contract.create",
        { organization_id: a.id, kind: "trial", modules: ["microtalento"] },
      ],
      ["role.set", { email: "other@example.invalid", role: "editor" }],
      ["user.status", { user_id: ids.root, enabled: false }],
      [
        "membership.set",
        {
          organization_id: b.id,
          workspace_id: b.workspace_id,
          email: "other@example.invalid",
          role: "professional",
        },
      ],
      [
        "membership.set",
        {
          organization_id: a.id,
          email: "other@example.invalid",
          role: "institution_admin",
        },
      ],
      [
        "membership.set",
        {
          organization_id: a.id,
          workspace_id: b.workspace_id,
          email: "other@example.invalid",
          role: "professional",
        },
      ],
    ])
      await assert.rejects(command(ids.professional, action, data), action);
    await command(ids.professional, "membership.set", {
      organization_id: a.id,
      workspace_id: a.workspace_id,
      email: "other@example.invalid",
      role: "professional",
    });
    const snapshot = (
      await asUser(db, ids.professional, (tx) =>
        tx.query("select micro_admin_snapshot($1) value", [a.id]),
      )
    ).rows[0].value;
    assert.equal(snapshot.organizations.length, 1);
    assert.equal(snapshot.contracts.length, 0);
    assert.equal(snapshot.payments.length, 0);
    assert.ok(
      snapshot.users.every((u) =>
        [ids.professional, ids.other].includes(u.user_id),
      ),
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query("select micro_admin_snapshot($1)", [b.id]),
      ),
    );
    const pkg = await command(ids.root, "package.save", {
      name: "QA paquete",
      modules: ["microtalento"],
    });
    const contract = await command(ids.root, "contract.create", {
      organization_id: a.id,
      kind: "trial",
      package_id: pkg.id,
    });
    await command(ids.root, "package.save", {
      id: pkg.id,
      name: "QA futuro",
      modules: ["swap"],
    });
    assert.equal(
      (
        await db.query(
          "select module_id from micro_contract_modules where contract_id=$1",
          [contract.id],
        )
      ).rows[0].module_id,
      "microtalento",
    );
    await command(ids.professional, "membership.set", {
      organization_id: a.id,
      workspace_id: a.workspace_id,
      email: "other@example.invalid",
      role: "professional",
      enabled: false,
    });
    assert.equal(
      (
        await asUser(db, ids.other, (tx) =>
          tx.query("select micro_can_workspace($1,'microtalento') allowed", [
            a.workspace_id,
          ]),
        )
      ).rows[0].allowed,
      false,
    );
  } finally {
    await db.close();
  }
});

test("revoked sessions, unverified or revoked invitations cannot restore access", async () => {
  const db = await database();
  try {
    await asUser(db, ids.registered, (tx) =>
      tx.query("select micro_session_revoke_current()"),
    );
    assert.equal(
      (
        await asUser(db, ids.registered, (tx) =>
          tx.query("select micro_identity_active() active"),
        )
      ).rows[0].active,
      false,
    );
    const oldIat = Math.floor(Date.now() / 1000) - 100;
    await asUser(
      db,
      ids.other,
      (tx) => tx.query("select micro_sessions_revoke_all()"),
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    );
    const unknown = await asUser(db, ids.other, async (tx) => {
      await tx.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: ids.other,
          session_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          iat: oldIat,
        }),
      ]);
      return tx.query("select micro_identity_active() active");
    });
    assert.equal(unknown.rows[0].active, false);
    const newLogin=await asUser(db,ids.other,(tx)=>tx.query("select micro_identity_active() active"),"ffffffff-ffff-4fff-8fff-ffffffffffff");
    assert.equal(newLogin.rows[0].active,true,"A fresh login remains available immediately after global sign-out");
    const hash = "b".repeat(64);
    await asUser(db, ids.root, (tx) =>
      tx.query("select micro_admin_command('invitation.create',$1)", [
        JSON.stringify({
          email: "professional@example.invalid",
          role: "author",
          token_hash: hash,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        }),
      ]),
    );
    await db.query(
      "update auth.users set email_confirmed_at=null where id=$1",
      [ids.professional],
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query("select micro_accept_invitation($1)", [hash]),
      ),
    );
    await db.query(
      "update auth.users set email_confirmed_at=now() where id=$1",
      [ids.professional],
    );
    await db.query(
      "update micro_invitations set revoked_at=now() where token_hash=$1",
      [hash],
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query("select micro_accept_invitation($1)", [hash]),
      ),
    );
    await db.query(
      "update micro_invitations set revoked_at=null,expires_at=now()-interval '1 minute' where token_hash=$1",
      [hash],
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query("select micro_accept_invitation($1)", [hash]),
      ),
    );
  } finally {
    await db.close();
  }
});

test("all Ecosystem migrations can be reapplied without deleting records", async () => {
  const db = await database();
  try {
    await asUser(db, ids.root, (tx) =>
      tx.query(
        "select micro_admin_command('organization.create','{\"name\":\"Persistente\"}')",
      ),
    );
    const before = (await db.query("select id,name from micro_organizations"))
      .rows;
    const directory = new URL("../supabase/migrations/", import.meta.url);
    for (const name of (await readdir(directory))
      .filter((n) => n.startsWith("20261125"))
      .sort())
      await db.exec(await readFile(new URL(name, directory), "utf8"));
    assert.deepEqual(
      (await db.query("select id,name from micro_organizations")).rows,
      before,
    );
  } finally {
    await db.close();
  }
});

test("the test database backup restores institutions, permissions and audit records", async () => {
  const db = await database();
  let restored;
  try {
    await asUser(db, ids.root, (tx) =>
      tx.query(
        "select micro_admin_command('organization.create','{\"name\":\"Respaldo ficticio\"}')",
      ),
    );
    const snapshot = await db.dumpDataDir();
    restored = new PGlite({ loadDataDir: snapshot });
    assert.deepEqual(
      (await restored.query("select id,name from micro_organizations")).rows,
      (await db.query("select id,name from micro_organizations")).rows,
    );
    assert.equal(
      (await restored.query("select count(*)::int n from micro_admin_events"))
        .rows[0].n,
      1,
    );
    assert.equal(
      (
        await asUser(restored, ids.professional, (tx) =>
          tx.query("select micro_is_root() allowed"),
        )
      ).rows[0].allowed,
      false,
    );
  } finally {
    await restored?.close();
    await db.close();
  }
});
