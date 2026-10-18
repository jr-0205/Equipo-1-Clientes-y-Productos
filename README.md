# Equipo 1 — Microservicios de Clientes y Productos

Dos microservicios **Node.js + Express**, cada uno con su propia base de datos **SQLite**
persistente y ejecutados con **Docker Compose**. Cumplen el reglamento común del proyecto
(`../reglas.md`).

| Documento | Contenido |
|---|---|
| Este README | Cómo ejecutar, rutas, contrato de datos y cómo conectar con los equipos 2 y 3 |
| `../reglas.md` | Acuerdo de integración de los tres equipos (puertos, red, firewall, checklist) |
| `ROUTES.md` | Rutas y contratos de este equipo (documento compartido con los otros equipos) |
| `MICROSERVICES_STANDARD.md` | Estándar general de microservicios SuperPOS (acuerdo de los tres equipos) |
| `.env.example` | Plantilla de configuración común: puertos e IPs/hosts de los tres equipos |
| `postman/` | Colección Postman lista para probar los dos servicios |

## 1. Servicios y puertos

| Servicio | Puerto interno (contenedor) | Puerto publicado (host) | URL desde otra PC | Base de datos |
|---|---:|---:|---|---|
| **clientes** | 3001 | **2501** | `http://IP-EQUIPO-1:2501` | SQLite `clientes_data` |
| **productos** | 3002 | **2502** | `http://IP-EQUIPO-1:2502` | SQLite `productos_data` |

- Dentro de esta computadora los servicios se ven como `http://clientes:3001` y
  `http://productos:3002` (red Docker `equipo1-net`).
- Entre computadoras **solo** funciona la IP de esta PC con los puertos publicados
  **2501** y **2502**. Nunca uses `localhost` desde otro equipo ni el nombre del
  contenedor como hostname.

## 2. Estructura

```text
Equipo-1-Clientes-y-Productos/
|-- clientes/
|   |-- app.js
|   |-- package.json
|   |-- Dockerfile
|-- productos/
|   |-- app.js
|   |-- package.json
|   |-- Dockerfile
|-- postman/
|   |-- Equipo-1-Clientes-Productos.postman_collection.json
|-- docker-compose.yml
|-- .env.example
|-- README.md
```

## 3. Requisitos

- Docker Desktop instalado y **en ejecución** (en Windows, con Docker Compose v2).
- PowerShell para las pruebas.
- Nada de Node.js local: todo corre dentro de los contenedores.

## 4. Ejecutar

```powershell
git clone https://github.com/jr-0205/Equipo-1-Clientes-y-Productos.git
cd Equipo-1-Clientes-y-Productos
node configurar-ips.mjs          # genera el .env a partir de ip-path
docker compose up --build -d
docker compose ps                # ambos servicios deben aparecer "healthy"
```

### Configurar las direcciones de todos los equipos (`ip-path`)

`ip-path` es la **única fuente de verdad** de las direcciones: se edita una vez y un comando
genera el `.env` de este repositorio (que es local y no se versiona).

```powershell
notepad ip-path                  # IP de cada laptop; deja `auto` en esta PC
node configurar-ips.mjs          # genera el .env
node configurar-ips.mjs --probar # además prueba /health de cada dirección
```

- `auto` significa "ese equipo corre en esta computadora"; para los contenedores se traduce
  en `host.docker.internal`.
- Este equipo publica **2501** y **2502**; los demás te alcanzan en
  `http://IP-EQUIPO-1:2501` y `http://IP-EQUIPO-1:2502`.
- Antes de sobrescribir un `.env` existente se guarda una copia en `.env.respaldo`.
- Si los cuatro repositorios están en la misma carpeta, se configura todo de una vez desde la
  raíz del proyecto con `node configurar-ips.mjs`.

Abre en el navegador de esta PC:

- http://localhost:2501/ y http://localhost:2501/health
- http://localhost:2501/clientes
- http://localhost:2502/ y http://localhost:2502/health
- http://localhost:2502/productos

Los servicios insertan datos de ejemplo cuando la base está vacía.

## 5. Rutas (documentación para los equipos 2 y 3)

### clientes — base `http://IP-EQUIPO-1:2501`

| Método | Ruta | Función | Cuerpo (JSON) | Respuesta correcta |
|---|---|---|---|---|
| GET | `/` | Información del servicio y rutas | — | `200` |
| GET | `/health` | Estado del servicio y de la base | — | `200` |
| GET | `/clientes` | Lista clientes | — | `200` + arreglo |
| GET | `/clientes/:id` | Consulta un cliente | — | `200` + objeto |
| POST | `/clientes` | Crea cliente | `{ "nombre": "...", "correo": "..." }` | `201` + objeto creado |
| PUT | `/clientes/:id` | Reemplaza `nombre` y `correo` | `{ "nombre": "...", "correo": "..." }` | `200` + objeto |
| PATCH | `/clientes/:id` | Actualiza solo los campos enviados | `{ "correo": "..." }` | `200` + objeto |
| DELETE | `/clientes/:id` | Elimina un cliente | — | `200` + `{ mensaje, id }` |

### productos — base `http://IP-EQUIPO-1:2502`

| Método | Ruta | Función | Cuerpo (JSON) | Respuesta correcta |
|---|---|---|---|---|
| GET | `/` | Información del servicio y rutas | — | `200` |
| GET | `/health` | Estado del servicio y de la base | — | `200` |
| GET | `/productos` | Lista productos | — | `200` + arreglo |
| GET | `/productos/:id` | Consulta un producto | — | `200` + objeto |
| POST | `/productos` | Crea producto | `{ "nombre": "...", "precio": 100, "stock": 5 }` | `201` + objeto creado |
| PUT | `/productos/:id` | Reemplaza los campos | `{ "nombre": "...", "precio": 100, "stock": 5 }` | `200` + objeto |
| PATCH | `/productos/:id` | Actualiza solo los campos enviados | `{ "precio": 120 }` | `200` + objeto |
| DELETE | `/productos/:id` | Elimina un producto | — | `200` + `{ mensaje, id }` |

### Códigos de error (JSON en todos los casos)

| Código | Cuándo | Ejemplo de respuesta |
|---|---|---|
| `400` | Falta un campo obligatorio, `precio`/`stock` inválido o `id` no numérico | `{ "error": "El campo 'correo' es obligatorio" }` |
| `404` | No existe el `id` o la ruta | `{ "error": "Cliente no encontrado" }` |
| `409` | `correo` de cliente duplicado | `{ "error": "Ya existe un cliente con ese correo" }` |
| `500` / `503` | Error interno o base no disponible | `{ "error": "Error interno del servicio clientes" }` |

## 6. Contrato de datos (nombres oficiales entre equipos)

| Recurso | Respuesta oficial | Petición oficial |
|---|---|---|
| Clientes | `id`, `nombre`, `correo` | `nombre`, `correo` |
| Productos | `id`, `nombre`, `precio`, `stock` | `nombre`, `precio`, `stock` (`stock` opcional, toma `0`) |

- **No** uses alias como `name`, `email` o `price` en las peticiones entre servicios.
- `stock` en Productos es **informativo**. El stock real se consulta y actualiza en el
  microservicio **Inventario del Equipo 3**.
- El `id` del producto debe corresponder con el `productoId` del inventario del Equipo 3,
  porque Pedidos usa ese ID para verificar y descontar existencias.

## 7. Integración con los equipos 2 y 3

Los otros equipos **no** configuran nada dentro de este repositorio: ellos escriben la IP de
esta computadora en **su** archivo `.env`.

Equipo 2 (`Equipo-2-Pedidos-y-Pagos/.env`):

```env
CLIENTES_URL=http://IP-EQUIPO-1:2501
PRODUCTOS_URL=http://IP-EQUIPO-1:2502
```

Equipo 3 / frontend (`SuperPOS`, panel **Conexiones API**):

- Clientes → `http://IP-EQUIPO-1:2501` (rutas `/clientes`)
- Productos → `http://IP-EQUIPO-1:2502` (rutas `/productos`)

Si el Equipo 3 usa su Nginx como proxy, debe apuntar con variables de entorno, no con una
IP escrita a mano:

```nginx
location /clientes  { proxy_pass ${CLIENTES_URL}/clientes;  }
location /productos { proxy_pass ${PRODUCTOS_URL}/productos; }
```

### Datos de contacto de este equipo (llenar y compartir)

| Dato | Valor |
|---|---|
| Integrantes | |
| IPv4 de la laptop (`ipconfig`) | |
| Hostname (`hostname`) | |
| Puertos publicados | 2501 (clientes), 2502 (productos) |
| Firewall abierto | ☐ 2501 ☐ 2502 |

## 8. Firewall de Windows (en esta computadora)

```powershell
New-NetFirewallRule -DisplayName "Micro E1 Clientes 2501"  -Direction Inbound -Protocol TCP -LocalPort 2501 -Action Allow
New-NetFirewallRule -DisplayName "Micro E1 Productos 2502" -Direction Inbound -Protocol TCP -LocalPort 2502 -Action Allow
Get-NetFirewallRule -DisplayName "Micro E1*" | Select-Object DisplayName, Enabled, Action
Get-NetConnectionProfile     # el perfil de red debe ser Private, no Public
```

## 9. Comprobaciones (obligatorias antes de la demostración)

Desde **esta** computadora:

```powershell
Invoke-RestMethod http://localhost:2501/health
Invoke-RestMethod http://localhost:2501/clientes
Invoke-RestMethod http://localhost:2502/health
Invoke-RestMethod http://localhost:2502/productos
```

Desde **otra** computadora (sustituye la IP real):

```powershell
Test-Connection 192.168.1.101 -Count 2                        # ping
Test-NetConnection 192.168.1.101 -Port 2501                    # TCP abierto
Test-NetConnection 192.168.1.101 -Port 2502
Invoke-RestMethod http://192.168.1.101:2501/health
Invoke-RestMethod http://192.168.1.101:2502/health
```

Pruebas rápidas de escritura (POST):

```powershell
$body = @{ nombre = "María Torres"; correo = "maria@example.com" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:2501/clientes -ContentType "application/json" -Body $body

$body = @{ nombre = "Teclado USB"; precio = 450; stock = 10 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:2502/productos -ContentType "application/json" -Body $body
```

Con Postman: importa `postman/Equipo-1-Clientes-Productos.postman_collection.json` y cambia
la variable `host` por la IP de esta computadora.

## 10. Administración

```powershell
docker compose logs -f                      # ver registros
docker compose logs --tail=100 clientes productos
docker compose ps                           # estado y salud
docker compose down                         # detener
docker compose down -v                      # detener y BORRAR los datos persistentes (destructivo)
```

## 11. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El otro equipo no conecta y `ping` funciona | Firewall de Windows | Crear las reglas de la sección 8 |
| `ping` tampoco funciona | Redes distintas o red de invitados con aislamiento | Usar la misma LAN y perfil Private |
| La IP de esta PC cambió | IP dinámica (DHCP) | Pedir IP fija/reserva y avisar a los equipos 2 y 3 |
| `docker compose up` falla porque el puerto está ocupado | Otro servicio usa 2501/2502 | Ajustar `CLIENTES_PORT`/`PRODUCTOS_PORT` en `.env` **y avisar** a los otros equipos |
| Los servicios se ven `unhealthy` | La base no inicializó | `docker compose logs clientes productos` y `docker compose down -v` solo si se acepta borrar datos |
| `409` al crear cliente | El correo ya existe | Usar otro correo o actualizar el cliente existente |
