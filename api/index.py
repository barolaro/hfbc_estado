"""Entrada web para Vercel del dashboard HFBC."""

from flask import Flask, Response

from actualizaciones import aplicar_actualizaciones


app = Flask(__name__)


@app.get("/")
@app.get("/<path:_path>")
def dashboard(_path: str = "") -> Response:
    return Response(aplicar_actualizaciones(""), content_type="text/html; charset=utf-8")
