// POST /api/auth/logout → raderar sessionen
//
// POST och inte GET med flit: en utloggning ändrar tillstånd, och en GET
// kan utlösas av en förhämtad länk eller en bildtagg. Kakan är SameSite=Lax,
// men att låta rutten vara POST kostar ingenting och tar bort frågan.

import { json, destroySession, clearCookie } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (db) await destroySession(db, request);
  // Svarar ok även utan session — utloggning ska aldrig kunna misslyckas
  // från kundens sida, och ett fel här hjälper bara en angripare att veta
  // att kakan var giltig.
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
}
