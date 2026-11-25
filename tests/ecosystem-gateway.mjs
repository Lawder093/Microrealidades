// Adaptador HTTP exclusivo de QA: ejecuta las migraciones y RLS reales en PostgreSQL/PGlite.
// Sustituye únicamente transporte/Auth/Storage externos; no implementa reglas comerciales.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { database, ids } from "./ecosystem-db.mjs";

export const QA_PUBLIC_KEY = "qa-public-key";
export const QA_SERVICE_KEY = "qa-service-key-never-production";
export const QA_PASSWORD = "Prueba-local-001!";
const quote = (name) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error("Invalid identifier");
  return `"${name}"`;
};
const split = (value) => value.split(/,(?![^()]*\))/);
const parameter = (value) =>
  value !== null && typeof value === "object" ? JSON.stringify(value) : value;

export async function evaluationGateway(port = 4881) {
  const db = await database();
  const tokens = new Map(),
    refreshes = new Map(),
    objects = new Map(),
    mail = [];
  const userData = async (id) =>
    (
      await db.query(
        "select id,email,raw_user_meta_data as user_metadata from auth.users where id=$1",
        [id],
      )
    ).rows[0];
  const session = async (id, existing) => {
    const record = {
      userId: id,
      sessionId: existing?.sessionId ?? randomUUID(),
      iat: Math.floor(Date.now() / 1000),
    };
    const token = randomUUID(),
      refresh = randomUUID();
    await db.query(
      "insert into auth.sessions(id,user_id)values($1,$2)on conflict(id)do nothing",
      [record.sessionId, id],
    );
    tokens.set(token, record);
    refreshes.set(refresh, record);
    return {
      access_token: token,
      refresh_token: refresh,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      user: await userData(id),
    };
  };
  const execute = async (headers, callback) =>
    db.transaction(async (tx) => {
      const token = (headers.authorization ?? "").replace(/^Bearer /i, "");
      const identity = tokens.get(token);
      const role =
        token === QA_SERVICE_KEY
          ? "service_role"
          : identity
            ? "authenticated"
            : "anon";
      await tx.exec(`set local role ${role}`);
      await tx.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          identity?.userId ?? "",
          JSON.stringify(
            identity
              ? {
                  sub: identity.userId,
                  session_id: identity.sessionId,
                  iat: identity.iat,
                }
              : { role },
          ),
        ],
      );
      return callback(tx, identity);
    });
  const server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:4882");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "authorization,apikey,content-type,x-client-info",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }
    const send = (data, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(data, (_, v) => (typeof v === "bigint" ? Number(v) : v)),
      );
    };
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bytes = Buffer.concat(chunks);
      const input =
        bytes.length && String(req.headers["content-type"]).includes("json")
          ? JSON.parse(bytes.toString())
          : {};
      if (url.pathname.startsWith("/auth/v1/")) {
        const action = url.pathname.slice(9),
          token = (req.headers.authorization ?? "").replace(/^Bearer /i, "");
        if (action === "user") {
          const identity = tokens.get(token);
          if (!identity)
            return send({ error_code: "invalid_credentials" }, 401);
          if (req.method === "PUT")
            mail.push({ type: "password-change", userId: identity.userId });
          return send(await userData(identity.userId));
        }
        if (action === "token") {
          if (url.searchParams.get("grant_type") === "refresh_token") {
            const previous = refreshes.get(input.refresh_token);
            if (!previous)
              return send({ error_code: "invalid_credentials" }, 401);
            return send(await session(previous.userId, previous));
          }
          const user = (
            await db.query("select id from auth.users where email=$1", [
              input.email,
            ])
          ).rows[0];
          return user && input.password === QA_PASSWORD
            ? send(await session(user.id))
            : send({ error_code: "invalid_credentials" }, 401);
        }
        if (action === "signup") {
          const id = randomUUID();
          await db.query(
            "insert into auth.users(id,email,raw_user_meta_data)values($1,$2,$3)",
            [id, input.email, JSON.stringify(input.data ?? {})],
          );
          return send(await session(id));
        }
        if (["recover", "otp"].includes(action)) {
          mail.push({
            type: action,
            ...input,
            redirect: url.searchParams.get("redirect_to"),
          });
          return send({});
        }
        if (action === "logout") {
          tokens.delete(token);
          return send({});
        }
        return send({ error: "Unsupported QA auth operation" }, 400);
      }
      if (url.pathname.startsWith("/storage/v1/object/")) {
        if (req.headers.authorization !== `Bearer ${QA_SERVICE_KEY}`)
          return send({ error: "Forbidden" }, 403);
        const path = decodeURIComponent(url.pathname.slice(19));
        if (req.method === "POST") {
          objects.set(path, { bytes, type: req.headers["content-type"] });
          const [bucket, ...parts] = path.split("/");
          await db.query(
            "insert into storage.objects(bucket_id,name)select $1,$2 where not exists(select 1 from storage.objects where bucket_id=$1 and name=$2)",
            [bucket, parts.join("/")],
          );
          return send({ Key: path });
        }
        if (req.method === "DELETE") {
          for (const prefix of input.prefixes ?? [])
            objects.delete(`${path}/${prefix}`);
          return send({});
        }
        const object = objects.get(path);
        if (!object) return send({ error: "Not found" }, 404);
        res.writeHead(200, { "Content-Type": object.type });
        return res.end(object.bytes);
      }
      if (!url.pathname.startsWith("/rest/v1/"))
        return send({ error: "Not found" }, 404);
      const path = url.pathname.slice(9);
      if (path.startsWith("rpc/")) {
        const name = quote(path.slice(4));
        const args = Object.entries(input);
        const result = await execute(req.headers, (tx) =>
          tx.query(
            `select public.${name}(${args.map(([key], i) => `${quote(key)}=>$${i + 1}`).join(",")}) as value`,
            args.map(([, v]) => parameter(v)),
          ),
        );
        return send(result.rows[0].value);
      }
      const table = quote(path);
      if (Array.isArray(input.tags))
        input.tags = `{${input.tags.map((tag) => JSON.stringify(tag)).join(",")}}`;
      const params = [];
      const add = (value) => {
        params.push(parameter(value));
        return `$${params.length}`;
      };
      const projection = (select = "*", alias = "t") =>
        split(select)
          .map((column) => {
            if (column === "*") return `${alias}.*`;
            if (column.startsWith("baterias(")) {
              const columns = column.slice(9, -1).split(",");
              return `(select jsonb_build_object(${columns.flatMap((field) => [`'${field}'`, `b.${quote(field)}`]).join(",")}) from public.baterias b where b.id=t.bateria_id) as baterias`;
            }
            return `${alias}.${quote(column)}`;
          })
          .join(",");
      const filters = [];
      for (const [key, value] of url.searchParams) {
        if (["select", "order", "limit", "offset"].includes(key)) continue;
        if (key === "or") {
          filters.push(
            `(${value
              .slice(1, -1)
              .split(",")
              .map((term) => {
                const [column, operator, ...rest] = term.split(".");
                if (operator !== "ilike") throw new Error("Unsupported filter");
                return `t.${quote(column)} ilike ${add(rest.join(".").replaceAll("*", "%"))}`;
              })
              .join(" or ")})`,
          );
          continue;
        }
        const [operator, ...rest] = value.split(".");
        const operators = {
          eq: "=",
          neq: "<>",
          lte: "<=",
          gte: ">=",
          lt: "<",
          gt: ">",
        };
        if (!operators[operator]) throw new Error("Unsupported filter");
        filters.push(
          `t.${quote(key)}${operators[operator]}${add(rest.join("."))}`,
        );
      }
      const where = filters.length ? ` where ${filters.join(" and ")}` : "";
      let sql;
      if (req.method === "GET") {
        sql = `select ${projection(url.searchParams.get("select") ?? "*")} from public.${table} t${where}`;
        if (url.searchParams.has("order"))
          sql += ` order by ${url.searchParams
            .get("order")
            .split(",")
            .map((part) => {
              const [column, direction] = part.split(".");
              return `t.${quote(column)} ${direction === "desc" ? "desc" : "asc"}`;
            })
            .join(",")}`;
        sql += ` limit ${Math.min(10000, Number(url.searchParams.get("limit")) || 1000)} offset ${Math.max(0, Number(url.searchParams.get("offset")) || 0)}`;
      } else if (req.method === "POST") {
        const columns = Object.keys(input);
        sql = `insert into public.${table} as t(${columns.map(quote).join(",")})values(${columns.map((k) => add(input[k])).join(",")})`;
        if (String(req.headers.prefer).includes("merge-duplicates"))
          sql += ` on conflict(id)do update set ${columns
            .filter((k) => k !== "id")
            .map((k) => `${quote(k)}=excluded.${quote(k)}`)
            .join(",")}`;
        sql += " returning *";
      } else if (req.method === "PATCH") {
        sql = `update public.${table} t set ${Object.entries(input)
          .map(([key, value]) => `${quote(key)}=${add(value)}`)
          .join(",")}${where} returning *`;
      } else throw new Error("Unsupported QA method");
      const result = await execute(req.headers, (tx) => tx.query(sql, params));
      return send(
        String(req.headers.prefer).includes("return=minimal")
          ? null
          : result.rows,
      );
    } catch (error) {
      return send(
        { message: error.message, code: error.code },
        error.code === "23505" ? 409 : error.code === "42501" ? 403 : 400,
      );
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return {
    db,
    origin: `http://127.0.0.1:${port}`,
    session,
    objects,
    mail,
    ids,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      await db.close();
    },
  };
}
