import { json, isAdmin } from "../_shared/lib.js";

/* GET /api/session -> { admin: true|false, configured: {...} } */
export async function onRequestGet({ request, env }) {
  return json({
    admin: await isAdmin(request, env),
    configured: { password: !!env.ADMIN_PASSWORD, storage: !!env.CONTENT },
  });
}
