import assert from "node:assert/strict";
import test from "node:test";
import { database, asUser, ids } from "./ecosystem-db.mjs";

test("organizations provision modules by paid services and prevent self-assignment", async () => {
  const db = await database("202611250003");
  const command = (user, action, data) =>
    asUser(
      db,
      user,
      async (tx) =>
        (
          await tx.query("select micro_admin_command($1,$2) as result", [
            action,
            JSON.stringify(data),
          ])
        ).rows[0].result,
    );
  try {
    const org = await command(ids.root, "organization.create", {
      name: "Institución A",
    });
    const orgB = await command(ids.root, "organization.create", {
      name: "Institución B",
    });
    await command(ids.root, "membership.set", {
      organization_id: org.id,
      email: "professional@example.invalid",
      workspace_id: org.workspace_id,
      role: "professional",
    });
    const allowed = async (user, workspace, module = "microtalento") =>
      (
        await asUser(db, user, (tx) =>
          tx.query("select micro_can_workspace($1,$2) as allowed", [
            workspace,
            module,
          ]),
        )
      ).rows[0].allowed;
    assert.equal(await allowed(ids.professional, org.workspace_id), false);
    await assert.rejects(
      command(ids.registered, "role.set", {
        email: "registered@example.invalid",
        role: "editor",
      }),
    );
    await assert.rejects(
      command(ids.root, "membership.set", {
        organization_id: org.id,
        email: "root@example.invalid",
        workspace_id: org.workspace_id,
        role: "professional",
      }),
    );
    const paid = {
      organization_id: org.id,
      kind: "paid",
      amount: "1200.00",
      currency: "MXN",
      reference: "PRUEBA-001",
      modules: ["microtalento"],
      starts_at: "2026-01-01",
      ends_at: "2099-01-01",
    };
    const contract = await command(ids.root, "contract.create", paid);
    const repeated = await command(ids.root, "contract.create", paid);
    assert.equal(contract.id, repeated.id);
    assert.equal(
      (await db.query("select count(*)::int as count from micro_payments"))
        .rows[0].count,
      1,
    );
    assert.equal(await allowed(ids.professional, org.workspace_id), true);
    assert.equal(await allowed(ids.professional, orgB.workspace_id), false);
    assert.equal(await allowed(ids.root, org.workspace_id), false);
    assert.equal(
      await allowed(ids.professional, org.workspace_id, "swap"),
      false,
    );
    await command(ids.root, "contract.update", {
      id: contract.id,
      status: "suspended",
    });
    assert.equal(await allowed(ids.professional, org.workspace_id), false);
    await command(ids.root, "contract.update", {
      id: contract.id,
      status: "active",
      ends_at: "2026-02-01",
    });
    assert.equal(await allowed(ids.professional, org.workspace_id), false);
    await command(ids.root, "role.set", {
      email: "registered@example.invalid",
      role: "author",
    });
    const editorial = await asUser(db, ids.registered, (tx) =>
      tx.query(
        "select micro_has_editorial('write') as write,micro_has_editorial('publish') as publish",
      ),
    );
    assert.deepEqual(editorial.rows[0], { write: true, publish: false });
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query("update micro_contracts set status='active'"),
      ),
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query("insert into micro_global_roles values($1,'editor',true)", [
          ids.professional,
        ]),
      ),
    );
  } finally {
    await db.close();
  }
});

test("invitations require the matching verified identity and are single-use", async () => {
  const db = await database("202611250003");
  try {
    const hash = "a".repeat(64);
    await asUser(db, ids.root, (tx) =>
      tx.query("select micro_admin_command('invitation.create',$1)", [
        JSON.stringify({
          email: "other@example.invalid",
          role: "author",
          token_hash: hash,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        }),
      ]),
    );
    await assert.rejects(
      asUser(db, ids.registered, (tx) =>
        tx.query("select micro_accept_invitation($1)", [hash]),
      ),
    );
    await asUser(db, ids.other, (tx) =>
      tx.query("select micro_accept_invitation($1)", [hash]),
    );
    await assert.rejects(
      asUser(db, ids.other, (tx) =>
        tx.query("select micro_accept_invitation($1)", [hash]),
      ),
    );
    const audit = await db.query(
      "select count(*)::int as count from micro_admin_events where action='invitation.accepted'",
    );
    assert.equal(audit.rows[0].count, 1);
  } finally {
    await db.close();
  }
});
