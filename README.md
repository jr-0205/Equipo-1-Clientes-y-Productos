# Equipo 1: Microservicios de Clientes y Productos

Proyecto creado desde cero con dos microservicios Flask, cada uno con su propia base de datos SQLite persistente y ejecutados con Docker Compose.

## Requisitos
- Docker Desktop con Docker Compose v2
- Git (para clonar el repositorio)

## Arquitectura

| Servicio | Puerto local | Base de datos | Función |
|---|---:|---|---|
| Clientes | 3001 | SQLite (`clientes_data`) | CRUD de clientes |
| Productos | 3002 | SQLite (`productos_data`) | CRUD de productos |

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
- http://localhost:3001/
- http://localhost:3001/health
- http://localhost:3001/clientes
- http://localhost:3002/
- http://localhost:3002/health
- http://localhost:3002/productos

Los servicios incluyen datos de ejemplo al inicializar una base vacía.

## Ejemplos de PowerShell

Listar clientes:
```powershell
Invoke-RestMethod http://localhost:3001/clientes
```

Crear cliente:
```powershell
$body = @{ nombre = "María Torres"; correo = "maria@example.com" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3001/clientes -ContentType "application/json" -Body $body
```

Listar productos:
```powershell
Invoke-RestMethod http://localhost:3002/productos
```

Crear producto:
```powershell
$body = @{ nombre = "Teclado USB"; precio = 450; stock = 10 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3002/productos -ContentType "application/json" -Body $body
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

Clientes usa `nombre` y `correo`. Productos usa `nombre`, `precio` y `stock`.

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
Desde otra computadora, sustituye `localhost` por la IP de la laptop que ejecuta Docker, y permite los puertos TCP 3001 y 3002 en el firewall de Windows.


## Contrato de integración con los equipos 2 y 3

Las direcciones base son `http://IP-DEL-EQUIPO-1:3001` para Clientes y
`http://IP-DEL-EQUIPO-1:3002` para Productos. Sustituye la IP de ejemplo por
la IPv4 real de esta computadora; no uses `localhost` desde otra computadora.

### Clientes
- `GET /clientes` y `GET /clientes/:id`
- `POST /clientes` acepta `{ "nombre": "...", "correo": "..." }` y también
  `{ "nombre": "...", "email": "..." }` para compatibilidad con Equipo 2.
- Las respuestas incluyen `correo` y `email` con el mismo valor para que
  clientes existentes de los otros equipos puedan leer cualquiera de los dos.

### Productos
- `GET /productos` y `GET /productos/:id`
- `POST /productos` acepta `{ "nombre": "...", "precio": 100, "stock": 5 }`.
  `stock` es opcional y toma el valor 0 si se omite, porque el stock definitivo
  debe consultarse y actualizarse en el microservicio Inventario del Equipo 3.
- Los precios se devuelven como `precio`, compatible con el servicio Pedidos del Equipo 2.

### Comunicación entre computadoras
Permite los puertos TCP 3001 y 3002 en el firewall de Windows. Desde otra PC
prueba `http://IP-DEL-EQUIPO-1:3001/health` y
`http://IP-DEL-EQUIPO-1:3002/health`.
