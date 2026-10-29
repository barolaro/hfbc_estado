# Tablero CTAR · Reposición por Vida Útil (HFBC)

Cruce entre el Plan CTAR y el registro del Hospital Dr. Félix Bulnes, con gestión de casos.
Acceso con usuario y clave; los datos se guardan en Postgres y los ve todo el equipo.

## Cómo está armado

| Parte | Dónde | Qué hace |
|---|---|---|
| Pantalla | `public/` | Sitio estático sin compilación (HTML, CSS y módulos JS). No contiene datos. |
| API | `api/v1.js` + `lib/` | Funciones de Vercel (Node). Autenticación, roles, equipos, seguimiento, auditoría y respaldo. |
| Datos iniciales | `lib/seed.json` | 117 tipologías. Se cargan una sola vez si la base está vacía. |
| Base de datos | Postgres (Neon, desde Vercel) | Usuarios, sesiones, equipos, seguimiento, historial y auditoría. |

La app Streamlit (`app.py`, `actualizaciones.py`) no forma parte de este despliegue y sigue en Streamlit Cloud.

## Perfiles

- **Administración**: crea usuarios, cambia perfiles, reinicia claves, ve la actividad, descarga respaldos y elimina equipos.
- **Edición**: agrega y modifica equipos, registra seguimiento y mueve casos.
- **Solo lectura**: consulta el cruce y el seguimiento.

No hay registro libre: solo Administración crea cuentas.

## Seguridad

- Claves con scrypt (sal única); mínimo 12 caracteres con letras y números. Clave temporal obligatoria de cambiar en el primer ingreso.
- Sesión en cookie `HttpOnly`, `Secure`, `SameSite=Strict`; vence a los 60 min sin uso o a las 12 h. En la base solo se guarda el hash del token.
- Bloqueo de 15 minutos tras 5 intentos fallidos por usuario (25 por IP). Mensaje idéntico para usuario inexistente y clave errónea.
- Verificación en dos pasos opcional (TOTP), con la clave cifrada en la base y código de un solo uso.
- Cada ruta valida el perfil en el servidor; la pantalla solo oculta botones.
- Defensa CSRF: cabecera propia, comprobación de origen y `SameSite=Strict`.
- Cabeceras: CSP sin scripts en línea, HSTS, `X-Frame-Options: DENY`, `nosniff`, sin referrer, `noindex`.
- Edición concurrente protegida por versión: si otra persona guardó antes, no se pisa su trabajo.
- Auditoría de ingresos, cambios y accesos denegados, con autor e IP. Historial de cada equipo y de cada seguimiento.
- Respaldo descargable por Administración, además de la restauración a un punto anterior que ofrece Neon.

## Variables de entorno

Ver `.env.example`. Con la integración Neon de Vercel, `DATABASE_URL` se crea sola.

## Pruebas locales

```bash
npm install
# Base Postgres local vacía:
export DATABASE_URL=postgres://postgres@localhost/hfbc_test
npm test                      # 18 pruebas de API (accesos, roles, bloqueo, 2 pasos, conflictos, auditoría)
export APP_SECRET=$(node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))")
export ADMIN_INICIAL_USUARIO=admin ADMIN_INICIAL_HASH=$(node scripts/hash-clave.js "Temporal-2026")
node dev.js 3000              # http://localhost:3000
```

## Actualizar los datos del cruce

Los equipos se agregan y editan desde la propia página (perfil Edición o Administración). `lib/seed.json` solo
se usa para poblar una base vacía.
