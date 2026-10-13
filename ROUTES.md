# ROUTES — Equipo 1: Clientes y Productos

## Convenciones
- API REST con JSON.
- Clientes base: `CLIENTES_URL`; Productos base: `PRODUCTOS_URL`.
- Campos oficiales: `id`, `nombre`, `correo`, `precio`, `stock` (según recurso).
- Desde otra computadora no usar `localhost`; usar hostname DNS o IP actual.

## Clientes
| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Salud del servicio |
| GET | `/` | Información de API |
| GET | `/clientes` | Listar |
| GET | `/clientes/:id` | Consultar por ID |
| POST | `/clientes` | Crear: `{ "nombre": "Ana", "correo": "ana@example.com" }` |
| PUT | `/clientes/:id` | Actualizar |
| DELETE | `/clientes/:id` | Eliminar |

## Productos
| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Salud del servicio |
| GET | `/` | Información de API |
| GET | `/productos` | Listar catálogo |
| GET | `/productos/:id` | Consultar por ID |
| POST | `/productos` | Crear: `{ "nombre": "Teclado", "precio": 450, "stock": 0 }` |
| PUT | `/productos/:id` | Actualizar |
| DELETE | `/productos/:id` | Eliminar |

## Integración y datos
El catálogo de Productos es la fuente de nombre/precio. Inventario del Equipo 3 es la fuente oficial de existencias. No alternar `correo/email`, `nombre/name` ni `precio/price`.

## Red
Permitir TCP 2501 y 2502 en el firewall del host.
