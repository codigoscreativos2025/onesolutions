# One Solutions

Aplicación web de gestión de leads y visitas para equipos de ventas door-to-door.

## Características

- **Roles**: Admin, Trainee (SETTER), Setter (SETTER_JR), Closer, Partner

## Tecnologías
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

### Mapa de parcelas (GIS gratis / freeregrid)

Por defecto el mapa usa el **GIS público de Orange County (Orlando, FL)** en lugar de Regrid:

- Centro inicial del mapa: **downtown Orlando**
- Polígonos y dueño desde ArcGIS del condado
- APIs: `/api/gis/geojson`, `/api/gis/parcels`, `/api/gis/search`, `/api/gis/parcel/[id]`

Variables en `.env`:

```env
PARCEL_PROVIDER=gis
# REGRID_API_KEY solo hace falta si PARCEL_PROVIDER=regrid
```

Rama de desarrollo: `freeregrid`.

**Probar en local:**

1. `npm run dev` → http://localhost:3000
2. Login con un usuario del seed
3. Ir a **Mapa** — debe abrir centrado en Orlando
4. Zoom ≥ 14 para ver polígonos de parcelas
5. Click en un polígono → sheet con dirección y nombre del propietario
6. Buscar p.ej. `54 W Church St` o una dirección de Orlando

Cobertura actual: **Orange County, FL**. Otros condados se añaden en `lib/gis/catalog.ts` + `lib/gis/providers/`.


## Limpiar la base de datos (SQLite)

```bash
# En local:
rm -f prisma/dev.db
npx prisma db push
npm run db:seed

# En EasyPanel (SSH):
rm -f /app/data/dev.db
npm run db:push
npm run db:seed

# Si da error "attempt to write a readonly database":
chmod 666 /app/data/dev.db
```

## Usuarios de prueba (seed)

| Rol | Email | Contraseña | Notas |
|-----|-------|-----------|-------|
| Admin | admin@onesolutions.com | admin | Acceso total, ve todas las etapas |
| Closer | closer@onesolutions.com | admin | Ve todas las etapas, cierra proyectos |
| Trainee | trainee@onesolutions.com | admin | SETTER — ve todas las etapas |
| Setter | setter@onesolutions.com | admin | SETTER_JR — solo ve Leads |
| Partner | partner@onesolutions.com | admin | Solo ve proyectos asignados |

El seed crea 5 usuarios + 6 tipos de proyecto (Panel Solar, Techo, Purificador, Fence, Gutters, Remodelacion).

## Licencia

Privado - One Solutions
