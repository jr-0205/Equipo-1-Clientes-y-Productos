# Equipo 1: Microservicios de Clientes y Productos

Proyecto de dos microservicios Node.js + Express, cada uno con su propia base de datos SQLite persistente y ejecutados con Docker Compose.

## Tecnologías
- Node.js 20 y Express
- APIs REST con JSON
- SQLite independiente para cada servicio
- Docker y Docker Compose v2
- Postman para pruebas HTTP

## Arquitectura

| Servicio | Puerto publicado | Puerto interno | Base de datos | Función |
|---|---:|---|---|
| Clientes | 2501 | 3001 | SQLite (`clientes_data`) | CRUD de clientes |
| Productos | 2502 | 3002 | SQLite (`productos_data`) | CRUD de productos |

Cada servicio es independiente. Los datos se guardan en volúmenes Docker para sobrevivir al reinicio de los contenedores.

## Ejecutar desde una laptop nueva

```powershell
git clone https://github.com/jr-0205/Equipo-1-Clientes-y-Productos.git
cd Equipo-1-Clientes-y-Productos
docker compose up --build -d
docker compose ps
```

## Probar que funcionan

Abre estas direcciones en el navegador:
- http://localhost:2501/
- http://localhost:2501/health
- http://localhost:2501/clientes
- http://localhost:2502/
- http://localhost:2502/health
- http://localhost:2502/productos

Los servicios incluyen datos de ejemplo al inicializar una base vacía.

## Ejemplos de PowerShell

Listar clientes:
```powershell
Invoke-RestMethod http://localhost:2501/clientes
```

Crear cliente:
```powershell
$body = @{ nombre = "María Torres"; correo = "maria@example.com" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:2501/clientes -ContentType "application/json" -Body $body
```

Listar productos:
```powershell
Invoke-RestMethod http://localhost:2502/productos
```

Crear producto:
```powershell
$body = @{ nombre = "Teclado USB"; precio = 450; stock = 10 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:2502/productos -ContentType "application/json" -Body $body
```

## Endpoints

Ambos servicios tienen:
- `GET /`: información y endpoints disponibles.
- `GET /health`: estado del servicio.
- `GET /<recurso>`: lista de registros.
- `GET /<recurso>/<id>`: consulta un registro.
- `POST /<recurso>`: crea un registro.
- `PUT /<recurso>/<id>`: reemplaza los campos editables.
- `DELETE /<recurso>/<id>`: elimina un registro.

Contrato único de datos (nombres en español): Clientes usa `id`, `nombre` y `correo`; Productos usa `id`, `nombre`, `precio` y `stock`. No se deben usar alias como `email`, `name` o `price` en las solicitudes entre servicios.

## Administración

Ver logs:
```powershell
docker compose logs -f
```

Detener servicios:
```powershell
docker compose down
```

Detener y borrar también los datos persistentes (acción destructiva):
```powershell
docker compose down -v
```

## Códigos de respuesta comunes
- `200`: operación correcta.
- `201`: registro creado.
- `400`: datos inválidos o faltantes.
- `404`: registro no encontrado.
- `409`: correo de cliente duplicado.

## Nota de red
Desde otra computadora, sustituye `localhost` por la IP de la laptop que ejecuta Docker, y permite los puertos TCP 2501 y 2502 en el firewall de Windows.


## Contrato de integración con los equipos 2 y 3

Las direcciones base son `http://IP-DEL-EQUIPO-1:2501` para Clientes y
`http://IP-DEL-EQUIPO-1:2502` para Productos. Sustituye la IP de ejemplo por
la IPv4 real de esta computadora; no uses `localhost` desde otra computadora.

### Clientes
- `GET /clientes` y `GET /clientes/:id`
- `POST /clientes` y `PUT /clientes/:id` usan exclusivamente `{ "nombre": "...", "correo": "..." }`.
- La respuesta devuelve exclusivamente `id`, `nombre` y `correo`. `correo` es el nombre oficial del campo de correo electrónico para los tres equipos.

### Productos
- `GET /productos` y `GET /productos/:id`
- `POST /productos` y `PUT /productos/:id` usan `{ "nombre": "...", "precio": 100, "stock": 5 }`. Los nombres oficiales son `nombre` y `precio` (no `name` ni `price`).
  `stock` es opcional y toma el valor 0 si se omite, porque el stock definitivo
  debe consultarse y actualizarse en el microservicio Inventario del Equipo 3.
- Los precios se devuelven como `precio`, compatible con el servicio Pedidos del Equipo 2.

### Comunicación entre computadoras
Permite los puertos TCP 2501 y 2502 en el firewall de Windows. Desde otra PC
prueba `http://IP-DEL-EQUIPO-1:2501/health` y
`http://IP-DEL-EQUIPO-1:2502/health`.
