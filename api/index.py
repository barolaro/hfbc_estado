"""Entrada web para Vercel del dashboard HFBC."""

from http.server import BaseHTTPRequestHandler

from actualizaciones import aplicar_actualizaciones


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        contenido = aplicar_actualizaciones("").encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(contenido)))
        self.end_headers()
        self.wfile.write(contenido)
