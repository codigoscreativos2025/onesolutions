# One Solutions

Aplicación web de gestión de leads y visitas para equipos de ventas door-to-door.

## Características

- **Roles**: Admin, Setter, Closer
- **Mapa de parcelas** con estados visuales (rojo/naranja/verde)
- **Flujo "Tocar Puerta"**: No disponible, Objeción, Acepta propuesta
- **Selección de proyectos**: Panel Solar, Techo, Purificador, Fence, Aires, Screens, Gutters, Jardines, etc.
- **Calendario mejorado** para closers con patrones semanales y generación automática de slots
- **Acciones en citas**: Ver proyecto, Visitar, Reasignar cita
- **Chat interno** con información del proyecto cerrada
- **Sistema de medallas** con ranking y metas configurables
- **Métricas del negocio** con metas semanales/mensuales y seguimiento
- **Objeciones configurables** para setters y closers (Trabajando con Objeciones)
- **Notificaciones funcionales** con campanita y dropdown
- **Soporte multilenguaje** (español / inglés)
- **Modo claro y oscuro**

## Tecnologías

- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS
- Prisma ORM + SQLite
- NextAuth.js v5
- next-themes
- Leaflet / React-Leaflet

## Desarrollo local

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

## Usuarios de prueba

| Email | Contraseña | Rol | Nombre |
|-------|------------|-----|--------|
| `admin@onesolutions.com` | `admin` | ADMIN | Admin Principal |
| `closer@onesolutions.com` | `closer` | CLOSER | Carlos Mendoza |
| `closer2@onesolutions.com` | `closer` | CLOSER | Ana Torres |
| `setter@onesolutions.com` | `setter` | SETTER | Alex Rivera (asignado a Carlos) |
| `setter2@onesolutions.com` | `setter` | SETTER | Maria Lopez (asignada a Carlos) |
| `setter3@onesolutions.com` | `setter` | SETTER | Juan Perez (asignado a Ana) |

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

- **Admin**: crea usuarios, configura objeciones (setter y closer), ve métricas con metas, gestiona medallas, monitorea chats.
- **Closer**: define patrones semanales, recibe citas de setters, puede ver proyecto/visitar/reasignar, cierra proyectos, llena detalles del proyecto.
- **Setter**: reclama parcelas, registra visitas, selecciona proyectos, agenda citas con su closer asignado.

## Flujo completo

1. **Setter toca puerta** → Reclama parcela (AVAILABLE → LEAD)
2. **Setter registra visita** → No disponible / Objeción / Acepta propuesta
3. **Si acepta propuesta** → Selecciona proyectos, sube bill, agenda slot con closer
4. **Closer ve cita** → Puede ver proyecto, visitar o reasignar
5. **Closer visita** → Registra objeciones de closer o acepta propuesta
6. **Si acepta propuesta** → Se crea chat, se llena ProjectDetails, parcela pasa a CUSTOMER
7. **Chat interno** → Setter, Closer y Admin pueden comunicarse

## Datos de prueba incluidos en seed

- 6 usuarios (1 admin, 2 closers, 3 setters)
- 11 tipos de proyecto
- 8 objeciones setter + 6 objeciones closer
- 4 medallas setter + 4 medallas closer
- 7 parcelas (disponibles, leads, clientes)
- 5 visitas con diferentes estados
- 3 chats con mensajes
- Metas semanales y mensuales
- Notificaciones de ejemplo

## Licencia

Privado - One Solutions
