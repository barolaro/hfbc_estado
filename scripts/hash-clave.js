// Genera el hash de una clave para ADMIN_INICIAL_HASH. Uso: node scripts/hash-clave.js "Clave temporal"
import { hashClave } from '../lib/seguridad.js';

const clave = process.argv[2];
if (!clave) {
  console.error('Uso: node scripts/hash-clave.js "ClaveTemporal"');
  process.exit(1);
}
console.log(await hashClave(clave));
