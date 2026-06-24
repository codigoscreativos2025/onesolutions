# One Solutions

Aplicación web de gestión de leads y visitas para equipos de ventas door-to-door.

## Características

- Roles: Admin, Setter, Closer
- Mapa de parcelas con estados visuales
- Flujo "Tocar Puerta": No disponible, Objeción, Acepta propuesta
- Calendario interno
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

## Despliegue en EasyPanel

1. Crear repositorio en GitHub y subir el código.
2. En EasyPanel, crear un nuevo servicio tipo App desde el repositorio.
3. Configurar variables de entorno:
   - `DATABASE_URL=file:/app/data/dev.db`
   - `NEXTAUTH_URL=https://tu-dominio.easypanel.host`
   - `AUTH_URL=https://tu-dominio.easypanel.host`
   - `NEXTAUTH_SECRET=<generar>`
   - `AUTH_TRUST_HOST=true`
   - `UPLOAD_DIR=/app/uploads`
4. Agregar volúmenes persistentes:
   - `/app/data`
   - `/app/uploads`
5. En la consola del servicio, ejecutar:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## Licencia

Privado - One Solutions
