// Helpers compartidos para las funciones serverless.

export function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).send(JSON.stringify(body));
}

// Lee el body JSON de forma robusta (Vercel suele parsearlo, pero por las dudas).
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

// Protege endpoints de admin. La contraseña viaja en el header 'x-admin-password'.
export function requireAdmin(req, res) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = req.headers['x-admin-password'];
  if (!expected) {
    sendJson(res, 500, { error: 'ADMIN_PASSWORD no configurada en el servidor.' });
    return false;
  }
  if (given !== expected) {
    sendJson(res, 401, { error: 'No autorizado.' });
    return false;
  }
  return true;
}
