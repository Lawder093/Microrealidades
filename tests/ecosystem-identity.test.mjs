import assert from "node:assert/strict";
import test from "node:test";
import { database, asUser, ids } from "./ecosystem-db.mjs";

test("MicroID profiles cannot promote users and sessions can only be revoked by their owner", async () => {
  const db = await database("202611250001");
  try {
    const context = await asUser(db,ids.registered,(tx) => tx.query("select micro_session_touch('Prueba') as result"));
    assert.equal(context.rows[0].result.sessions.length,1);
    await assert.rejects(asUser(db,ids.registered,(tx) => tx.query("update micro_profiles set is_active=false where user_id=$1",[ids.other])));
    await asUser(db,ids.registered,(tx) => tx.query("select micro_profile_update('Nombre público','Presentación')"));
    const name = await db.query("select display_name from micro_profiles where user_id=$1",[ids.registered]);
    assert.equal(name.rows[0].display_name,"Nombre público");
    await assert.rejects(asUser(db,ids.other,(tx) => tx.query("select micro_session_revoke('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')"),"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"));
    await asUser(db,ids.registered,(tx) => tx.query("select micro_sessions_revoke_all()"));
    await assert.rejects(asUser(db,ids.registered,(tx) => tx.query("select micro_session_touch('Reintento')")));
  } finally { await db.close(); }
});
