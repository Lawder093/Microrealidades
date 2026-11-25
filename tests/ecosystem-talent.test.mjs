import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { database, asUser, ids } from "./ecosystem-db.mjs";

test("Microtalento migration preserves history, isolates organizations and keeps root outside clinical data", async () => {
  const db = await database("202611250003");
  try {
    await db.query(
      "insert into reclutadores(id,nombre,email)values($1,'Profesional','professional@example.invalid')",
      [ids.professional],
    );
    const battery = (
      await db.query(
        "insert into baterias(reclutador_id,nombre,clasificacion_puesto,pruebas)values($1,'Histórica','custom',$2) returning id",
        [
          ids.professional,
          JSON.stringify([
            {
              prueba_id: "clinical-personalidad_trabajo",
              asignacion_id: "IB-20000",
            },
          ]),
        ],
      )
    ).rows[0];
    await db.query(
      "insert into sesiones_evaluacion(codigo,bateria_id,reclutador_id,estado,respuestas,resultados,pdf_path)values('IB-0008',$1,$2,'completado','{\"pt01\":4}','{\"globalScore\":75}','evaluaciones-pdf/history.pdf')",
      [battery.id, ids.professional],
    );
    const before = (
      await db.query(
        "select id,codigo,respuestas,resultados,pdf_path,reclutador_id from sesiones_evaluacion",
      )
    ).rows;
    const migration = await readFile(
      new URL(
        "../supabase/migrations/202611250004_microtalento_institutions.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    const after = (
      await db.query(
        "select id,codigo,respuestas,resultados,pdf_path,reclutador_id from sesiones_evaluacion",
      )
    ).rows;
    assert.deepEqual(after, before);
    assert.equal(
      (await db.query("select access_token from sesiones_evaluacion")).rows[0]
        .access_token,
      null,
    );
    const scope = (
      await db.query(
        "select organization_id,workspace_id from baterias where id=$1",
        [battery.id],
      )
    ).rows[0];
    const mine = await asUser(db, ids.professional, (tx) =>
      tx.query("select id from baterias"),
    );
    assert.equal(mine.rows.length, 1);
    assert.equal(
      (await asUser(db, ids.root, (tx) => tx.query("select id from baterias")))
        .rows.length,
      0,
    );
    assert.equal(
      (
        await asUser(db, ids.other, (tx) =>
          tx.query("select id from sesiones_evaluacion"),
        )
      ).rows.length,
      0,
    );
    const codes = await Promise.all(
      Array.from({ length: 4 }, () =>
        asUser(db, ids.professional, (tx) =>
          tx.query("select micro_next_evaluation_code($1) as code", [
            scope.workspace_id,
          ]),
        ),
      ),
    );
    assert.deepEqual(
      codes.map((entry) => entry.rows[0].code),
      ["IB-20001", "IB-20002", "IB-20003", "IB-20004"],
    );
    const org = (
      await asUser(db, ids.root, (tx) =>
        tx.query(
          "select micro_admin_command('organization.create','{\"name\":\"Segunda institución\"}') as result",
        ),
      )
    ).rows[0].result;
    await asUser(db, ids.root, (tx) =>
      tx.query("select micro_admin_command('membership.set',$1)", [
        JSON.stringify({
          organization_id: org.id,
          workspace_id: org.workspace_id,
          email: "professional@example.invalid",
          role: "professional",
        }),
      ]),
    );
    await asUser(db, ids.root, (tx) =>
      tx.query("select micro_admin_command('contract.create',$1)", [
        JSON.stringify({
          organization_id: org.id,
          kind: "trial",
          modules: ["microtalento"],
        }),
      ]),
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query(
          "update baterias set organization_id=$1,workspace_id=$2 where id=$3",
          [org.id, org.workspace_id, battery.id],
        ),
      ),
    );
    await assert.rejects(
      asUser(db, ids.professional, (tx) =>
        tx.query(
          "insert into sesiones_evaluacion(codigo,bateria_id,reclutador_id,organization_id,workspace_id)values('IB-CROSS',$1,$2,$3,$4)",
          [battery.id, ids.professional, org.id, org.workspace_id],
        ),
      ),
    );
    await db.exec(
      "insert into storage.objects(bucket_id,name)values('evaluaciones-pdf','history.pdf')",
    );
    assert.equal(
      (
        await asUser(db, ids.professional, (tx) =>
          tx.query("select name from storage.objects"),
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await asUser(db, ids.root, (tx) =>
          tx.query("select name from storage.objects"),
        )
      ).rows.length,
      0,
    );
    await db.query(
      "update micro_contracts set status='suspended' where organization_id=$1",
      [scope.organization_id],
    );
    assert.equal(
      (
        await asUser(db, ids.professional, (tx) =>
          tx.query("select id from baterias"),
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await asUser(db, ids.professional, (tx) =>
          tx.query("select name from storage.objects"),
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
