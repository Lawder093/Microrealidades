import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const ids = {
  root: "11111111-1111-4111-8111-111111111111",
  professional: "22222222-2222-4222-8222-222222222222",
  other: "33333333-3333-4333-8333-333333333333",
  registered: "44444444-4444-4444-8444-444444444444",
};
export async function database(until = "9999") {
  const db = new PGlite({ parsers: { 1184: (value) => value } });
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz default now(),created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid,owner_id text);
    alter table storage.objects enable row level security;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    grant all on storage.objects to anon,authenticated,service_role;
  `);
  for (const [name,id] of Object.entries(ids)) await db.query("insert into auth.users(id,email) values($1,$2)", [id,`${name}@example.invalid`]);
  const directory = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
  for (const name of (await readdir(directory)).filter((file) => file.endsWith(".sql") && file <= `${until}\uffff`).sort()) {
    await db.exec(await readFile(`${directory}/${name}`,"utf8"));
  }
  await db.query("insert into microhub_admins(user_id,is_super_root) values($1,true) on conflict(user_id) do update set is_super_root=true",[ids.root]);
  return db;
}

export async function asUser(db, user, action, session = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa") {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [user,JSON.stringify({ sub: user, session_id: session })]);
    return action(tx);
  });
}
