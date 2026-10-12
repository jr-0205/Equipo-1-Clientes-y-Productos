import os
import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE_PATH = os.getenv("DATABASE_PATH", "clientes.db")
PORT = int(os.getenv("PORT", "3001"))


def connect_db():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    os.makedirs(os.path.dirname(DATABASE_PATH) or ".", exist_ok=True)
    with connect_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                correo TEXT NOT NULL UNIQUE
            )
        """)
        count = db.execute("SELECT COUNT(*) FROM clientes").fetchone()[0]
        if count == 0:
            db.executemany(
                "INSERT INTO clientes (nombre, correo) VALUES (?, ?)",
                [
                    ("Ana Gómez", "ana@example.com"),
                    ("Carlos López", "carlos@example.com"),
                ],
            )


def serialize(row):
    return {"id": row["id"], "nombre": row["nombre"], "correo": row["correo"]}


@app.get("/")
def index():
    return jsonify({
        "servicio": "Equipo 1 - Clientes",
        "endpoints": {
            "health": "GET /health",
            "listar": "GET /clientes",
            "obtener": "GET /clientes/<id>",
            "crear": "POST /clientes",
            "actualizar": "PUT /clientes/<id>",
            "eliminar": "DELETE /clientes/<id>",
        },
    })


@app.get("/health")
def health():
    return jsonify({"status": "ok", "servicio": "clientes"}), 200


@app.get("/clientes")
def list_clients():
    with connect_db() as db:
        rows = db.execute("SELECT * FROM clientes ORDER BY id").fetchall()
    return jsonify([serialize(row) for row in rows])


@app.get("/clientes/<int:client_id>")
def get_client(client_id):
    with connect_db() as db:
        row = db.execute("SELECT * FROM clientes WHERE id = ?", (client_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Cliente no encontrado"}), 404
    return jsonify(serialize(row))


@app.post("/clientes")
def create_client():
    data = request.get_json(silent=True) or {}
    nombre = str(data.get("nombre", "")).strip()
    correo = str(data.get("correo", "")).strip().lower()
    if not nombre or not correo:
        return jsonify({"error": "Los campos 'nombre' y 'correo' son obligatorios"}), 400
    try:
        with connect_db() as db:
            cursor = db.execute(
                "INSERT INTO clientes (nombre, correo) VALUES (?, ?)",
                (nombre, correo),
            )
            row = db.execute("SELECT * FROM clientes WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return jsonify(serialize(row)), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Ya existe un cliente con ese correo"}), 409


@app.put("/clientes/<int:client_id>")
def update_client(client_id):
    data = request.get_json(silent=True) or {}
    nombre = str(data.get("nombre", "")).strip()
    correo = str(data.get("correo", "")).strip().lower()
    if not nombre or not correo:
        return jsonify({"error": "Los campos 'nombre' y 'correo' son obligatorios"}), 400
    try:
        with connect_db() as db:
            cursor = db.execute(
                "UPDATE clientes SET nombre = ?, correo = ? WHERE id = ?",
                (nombre, correo, client_id),
            )
            if cursor.rowcount == 0:
                return jsonify({"error": "Cliente no encontrado"}), 404
            row = db.execute("SELECT * FROM clientes WHERE id = ?", (client_id,)).fetchone()
        return jsonify(serialize(row))
    except sqlite3.IntegrityError:
        return jsonify({"error": "Ya existe un cliente con ese correo"}), 409


@app.delete("/clientes/<int:client_id>")
def delete_client(client_id):
    with connect_db() as db:
        cursor = db.execute("DELETE FROM clientes WHERE id = ?", (client_id,))
    if cursor.rowcount == 0:
        return jsonify({"error": "Cliente no encontrado"}), 404
    return jsonify({"mensaje": "Cliente eliminado correctamente", "id": client_id})


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=PORT)
