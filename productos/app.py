import os
import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE_PATH = os.getenv("DATABASE_PATH", "productos.db")
PORT = int(os.getenv("PORT", "3002"))


def connect_db():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    os.makedirs(os.path.dirname(DATABASE_PATH) or ".", exist_ok=True)
    with connect_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                precio REAL NOT NULL CHECK(precio >= 0),
                stock INTEGER NOT NULL CHECK(stock >= 0)
            )
        """)
        count = db.execute("SELECT COUNT(*) FROM productos").fetchone()[0]
        if count == 0:
            db.executemany(
                "INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)",
                [
                    ("Laptop Dell", 12999.00, 8),
                    ("Mouse Inalámbrico", 349.00, 25),
                ],
            )


def serialize(row):
    return {
        "id": row["id"],
        "nombre": row["nombre"],
        "precio": row["precio"],
        "stock": row["stock"],
    }


@app.get("/")
def index():
    return jsonify({
        "servicio": "Equipo 1 - Productos",
        "endpoints": {
            "health": "GET /health",
            "listar": "GET /productos",
            "obtener": "GET /productos/<id>",
            "crear": "POST /productos",
            "actualizar": "PUT /productos/<id>",
            "eliminar": "DELETE /productos/<id>",
        },
    })


@app.get("/health")
def health():
    return jsonify({"status": "ok", "servicio": "productos"}), 200


@app.get("/productos")
def list_products():
    with connect_db() as db:
        rows = db.execute("SELECT * FROM productos ORDER BY id").fetchall()
    return jsonify([serialize(row) for row in rows])


@app.get("/productos/<int:product_id>")
def get_product(product_id):
    with connect_db() as db:
        row = db.execute("SELECT * FROM productos WHERE id = ?", (product_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Producto no encontrado"}), 404
    return jsonify(serialize(row))


@app.post("/productos")
def create_product():
    data = request.get_json(silent=True) or {}
    nombre = str(data.get("nombre", "")).strip()
    try:
        precio = float(data.get("precio"))
        stock = int(data.get("stock"))
    except (TypeError, ValueError):
        return jsonify({"error": "Los campos 'precio' y 'stock' deben ser números"}), 400
    if not nombre or precio < 0 or stock < 0:
        return jsonify({"error": "Nombre obligatorio; precio y stock deben ser cero o mayores"}), 400
    with connect_db() as db:
        cursor = db.execute(
            "INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)",
            (nombre, precio, stock),
        )
        row = db.execute("SELECT * FROM productos WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(serialize(row)), 201


@app.put("/productos/<int:product_id>")
def update_product(product_id):
    data = request.get_json(silent=True) or {}
    nombre = str(data.get("nombre", "")).strip()
    try:
        precio = float(data.get("precio"))
        stock = int(data.get("stock"))
    except (TypeError, ValueError):
        return jsonify({"error": "Los campos 'precio' y 'stock' deben ser números"}), 400
    if not nombre or precio < 0 or stock < 0:
        return jsonify({"error": "Nombre obligatorio; precio y stock deben ser cero o mayores"}), 400
    with connect_db() as db:
        cursor = db.execute(
            "UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?",
            (nombre, precio, stock, product_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Producto no encontrado"}), 404
        row = db.execute("SELECT * FROM productos WHERE id = ?", (product_id,)).fetchone()
    return jsonify(serialize(row))


@app.delete("/productos/<int:product_id>")
def delete_product(product_id):
    with connect_db() as db:
        cursor = db.execute("DELETE FROM productos WHERE id = ?", (product_id,))
    if cursor.rowcount == 0:
        return jsonify({"error": "Producto no encontrado"}), 404
    return jsonify({"mensaje": "Producto eliminado correctamente", "id": product_id})


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=PORT)
