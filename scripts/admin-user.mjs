// Arma la entrada de un usuario del admin para la variable ADMIN_USERS (ver lib/admin-session.ts).
//
//   node scripts/admin-user.mjs franco "la contraseña"
//
// Imprime "franco:<sal>.<hash>". ADMIN_USERS lleva todas las entradas separadas por coma, en .env.local y en
// Vercel (Settings > Environment Variables). Volver a correrlo con otra contraseña cambia la del usuario.
import { randomBytes, scryptSync } from 'node:crypto';

const [username, password] = process.argv.slice(2);
if (!username || !password || !/^[a-z0-9_-]+$/i.test(username)) {
  console.error('Uso: node scripts/admin-user.mjs usuario "contraseña" (usuario: letras, números, - o _)');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
console.log(`${username.toLowerCase()}:${salt.toString('base64url')}.${hash.toString('base64url')}`);
