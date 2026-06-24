# One Solutions

Aplicación web de gestión de leads y visitas para equipos de ventas door-to-door.

## Características

- Roles: Admin, Setter, Closer
- Mapa de parcelas con estados visuales (rojo/naranja/verde)
- Flujo "Tocar Puerta": No disponible, Objeción, Acepta propuesta
- Calendario interno para closers
- Chat interno por proyecto aprobado
- Ranking global
- Soporte multilenguaje (español / inglés)
- Modo claro y oscuro

## Tecnologías

- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS
- Prisma ORM + SQLite
- NextAuth.js v5
- next-intl
- next-themes
- Leaflet / React-Leaflet

## Desarrollo local

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Usuarios de prueba:
- Admin: `admin@onesolutions.com` / `admin`
- Closer: `closer@onesolutions.com` / `closer`
- Setter: `setter@onesolutions.com` / `setter`

## Despliegue en EasyPanel (Hostinger)

### 1. Configurar el proyecto en EasyPanel

1. En EasyPanel, crea un nuevo **Project**.
2. Dentro del proyecto, crea un nuevo **Service** de tipo **App**.
3. En **Source**, conecta el repositorio de GitHub:
   - Repository: `https://github.com/codigoscreativos2025/onesolutions`
   - Branch: `main`
   - Root Directory: `/`
4. EasyPanel detectará automáticamente el `Dockerfile`.

### 2. Variables de entorno

Ve a la pestaña **Environment** y agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `file:/app/data/dev.db` |
| `NEXTAUTH_URL` | `https://tu-dominio.easypanel.host` |
| `AUTH_URL` | `https://tu-dominio.easypanel.host` |
| `NEXTAUTH_SECRET` | Genera uno con: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | `true` |
| `UPLOAD_DIR` | `/app/uploads` |
| `REGRID_API_KEY` | (Opcional) Tu API key de Regrid |

### 3. Volúmenes persistentes

Ve a **Service > Storage** y agrega dos volúmenes:

| Mount Path | Descripción |
|------------|-------------|
| `/app/data` | Base de datos SQLite |
| `/app/uploads` | Archivos subidos (bills, documentos) |

### 4. Inicializar la base de datos

Una vez que el servicio esté corriendo (en verde):

1. Ve a la pestaña **Console**.
2. Ejecuta:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

Esto creará las tablas y el usuario admin inicial.

### 5. Actualizaciones

Cada vez que hagas `git push` a la rama `main`, EasyPanel reconstruirá automáticamente la aplicación al hacer **Rebuild**.

## Integración con Regrid

Para usar parcelas reales:

1. Obtén una API key en [Regrid](https://regrid.com/).
2. Configura `REGRID_API_KEY` en las variables de entorno.
3. Reinicia el servicio.

Sin API key, la app usa parcelas de muestra en Orlando, FL.

## Estructura de roles

- **Admin**: crea usuarios, configura objeciones, ve métricas y chats.
- **Closer**: es también setter, define slots, recibe citas, cierra proyectos.
- **Setter**: reclama parcelas, registra visitas, agenda citas con su closer asignado.

## Licencia

Privado - One Solutions
