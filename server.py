#!/usr/bin/env python3
"""Maa Kali Enterprises — site server + control-panel API (stdlib only, no installs).

Run:  python3 server.py 8000
  Site:            http://localhost:8000
  Control panel:   http://localhost:8000/admin.html

API:
  GET  /api/data    -> site settings + products (data.json)
  POST /api/data    -> save settings + products  {settings, products}
  GET  /api/orders  -> list of received orders
  POST /api/order   -> place an order (from checkout)
  POST /api/upload?slot=<name> -> replace an image (raw image bytes in body)

NOTE: local demo server with no login — do not expose to the public internet.
"""
import datetime
import json
import os
import re
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, "images")
DATA_FILE = os.path.join(BASE_DIR, "data.json")
ORDERS_FILE = os.path.join(BASE_DIR, "orders.json")
MAX_IMG_BYTES = 8 * 1024 * 1024
MAX_JSON_BYTES = 1024 * 1024
SLOT_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,40}$")


def sniff_mime(data: bytes):
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return None


def read_json_file(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def write_json_file(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def guess_type(self, path):
        if path.startswith(IMG_DIR + os.sep) and path.lower().endswith(".jpg"):
            try:
                with open(path, "rb") as f:
                    mime = sniff_mime(f.read(16))
                if mime:
                    return mime
            except OSError:
                pass
        return super().guess_type(path)

    # ----- helpers -----
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self, limit):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return None
        if length <= 0 or length > limit:
            return None
        return self.rfile.read(length)

    # ----- routes -----
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/data":
            return self._json(200, read_json_file(DATA_FILE, {"settings": {}, "products": []}))
        if path == "/api/orders":
            return self._json(200, read_json_file(ORDERS_FILE, []))
        return super().do_GET()

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/upload":
            return self._handle_upload()
        if path == "/api/data":
            return self._handle_save_data()
        if path == "/api/order":
            return self._handle_order()
        if path == "/api/orders/clear":
            return self._handle_clear_orders()
        return self.send_error(404)

    def _handle_clear_orders(self):
        write_json_file(ORDERS_FILE, [])
        return self._json(200, {"ok": True, "cleared": True})

    def _handle_upload(self):
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        slot = (qs.get("slot", [""])[0] or "").strip()
        if not SLOT_RE.match(slot):
            return self._json(400, {"ok": False, "error": "Invalid image name."})
        data = self._read_body(MAX_IMG_BYTES)
        if data is None:
            return self._json(400, {"ok": False, "error": "File must be between 1 byte and 8 MB."})
        mime = sniff_mime(data)
        if not mime:
            return self._json(400, {"ok": False, "error": "Not a valid image (JPEG, PNG, WebP or GIF)."})
        tmp = os.path.join(IMG_DIR, ".%s.tmp" % slot)
        final = os.path.join(IMG_DIR, "%s.jpg" % slot)
        with open(tmp, "wb") as f:
            f.write(data)
        os.replace(tmp, final)
        return self._json(200, {"ok": True, "slot": slot, "mime": mime, "bytes": len(data)})

    def _handle_save_data(self):
        raw = self._read_body(MAX_JSON_BYTES)
        if raw is None:
            return self._json(400, {"ok": False, "error": "Request too large."})
        try:
            data = json.loads(raw.decode("utf-8"))
        except ValueError:
            return self._json(400, {"ok": False, "error": "Invalid JSON."})
        if not isinstance(data, dict) or not isinstance(data.get("settings"), dict) \
                or not isinstance(data.get("products"), list):
            return self._json(400, {"ok": False, "error": "Need {settings, products}."})
        for p in data["products"]:
            if not isinstance(p, dict) or not p.get("id") or not p.get("name"):
                return self._json(400, {"ok": False, "error": "Every product needs an id and name."})
            try:
                p["price"] = max(0, int(p.get("price", 0)))
            except (ValueError, TypeError):
                return self._json(400, {"ok": False, "error": "Bad price for '%s'." % p.get("name")})
        write_json_file(DATA_FILE, {"settings": data["settings"], "products": data["products"]})
        return self._json(200, {"ok": True, "products": len(data["products"])})

    def _handle_order(self):
        raw = self._read_body(MAX_JSON_BYTES)
        if raw is None:
            return self._json(400, {"ok": False, "error": "Request too large."})
        try:
            order = json.loads(raw.decode("utf-8"))
        except ValueError:
            return self._json(400, {"ok": False, "error": "Invalid JSON."})
        if not isinstance(order, dict) or not isinstance(order.get("items"), list) or not order["items"]:
            return self._json(400, {"ok": False, "error": "Order needs items."})
        try:
            total = float(order.get("total", 0))
        except (ValueError, TypeError):
            return self._json(400, {"ok": False, "error": "Bad total."})
        oid = "MKE-" + datetime.datetime.now().strftime("%y%m%d") + "-" + \
            str(abs(hash(json.dumps(order, sort_keys=True))) % 9000 + 1000)
        record = {
            "id": oid,
            "date": datetime.datetime.now().isoformat(timespec="seconds"),
            "customer": order.get("customer", {}),
            "items": order.get("items", []),
            "payment": order.get("payment", {}),
            "subtotal": order.get("subtotal", 0),
            "discount": order.get("discount", 0),
            "shipping": order.get("shipping", 0),
            "total": total,
        }
        orders = read_json_file(ORDERS_FILE, [])
        if not isinstance(orders, list):
            orders = []
        orders.insert(0, record)
        write_json_file(ORDERS_FILE, orders[:500])
        return self._json(200, {"ok": True, "id": oid})


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = int(os.environ.get("PORT", 8000))
    os.makedirs(IMG_DIR, exist_ok=True)
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print("Serving %s on 0.0.0.0:%d" % (BASE_DIR, port))
    server.serve_forever()
