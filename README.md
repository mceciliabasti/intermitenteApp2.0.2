# Club de Arte - Aplicación Web

Esta es una aplicación web construida con [Next.js](https://nextjs.org) y MongoDB para gestionar talleres de un club de arte. Soporta talleres cuatrimestrales y ocasionales.

## Características

- Listado de talleres disponibles
- Gestión de talleres con MongoDB
- API REST para operaciones CRUD en talleres
- Interfaz responsiva con Tailwind CSS

## Requisitos

- Node.js
- MongoDB (local o en la nube)

## Instalación

1. Clona el repositorio.
2. Instala las dependencias:

```bash
npm install
```

3. Configura la variable de entorno `MONGODB_URI` en `.env.local` (ejemplo incluido).

4. Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

- `src/app/`: Páginas y API routes
- `src/lib/`: Conexión a MongoDB
- `src/models/`: Modelos de datos (Workshop)

## API

- `GET /api/workshops`: Obtener todos los talleres
- `POST /api/workshops`: Crear un nuevo taller

## Próximos Pasos

- Agregar autenticación
- Formulario para crear talleres
- Gestión de inscripciones
- Más funcionalidades según requerimientos detallados

## Despliegue

Despliega en Vercel o cualquier plataforma que soporte Next.js. Asegúrate de configurar las variables de entorno.
