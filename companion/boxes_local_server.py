"""Small local server that runs Boxes.py (including FlexBox5Plus) for the 3D viewer.

The "Generate" button of the viewer calls  http://127.0.0.1:8777/<Generator>?<settings>  and displays the cutting
plan (SVG by default), exactly like the boxes.hackerspace-bamberg.de web site.

Start:   python boxes_local_server.py          (or double-click start_server.bat)
Boxes.py is searched in (in this order): the BOXES_SRC environment variable, ./boxes.py, ./boxes-master,
../boxes-master, ../../boxes.py, and %TEMP%\\bx5\\src\\boxes-master (with its dependencies in %TEMP%\\bx5\\deps).
Extra generators next to this file (flexbox5plus*.py) are loaded automatically; otherwise FlexBox5Plus is taken
from boxes/generators/ of the Boxes.py installation (if it was copied there).
"""
import importlib.util
import os
import sys
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qsl, urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("BOXES_PORT", "8777"))
TEMP = os.environ.get("TEMP", HERE)
for cand in (os.environ.get("BOXES_SRC"), os.path.join(HERE, "boxes.py"), os.path.join(HERE, "boxes-master"),
             os.path.join(HERE, "..", "boxes-master"), os.path.join(HERE, "..", "..", "boxes.py"),
             os.path.join(TEMP, "bx5", "src", "boxes-master")):
    if cand and os.path.isdir(os.path.join(cand, "boxes")):
        sys.path.insert(0, os.path.abspath(cand))
        for deps in (os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(cand))), "deps"), os.path.join(TEMP, "bx5", "deps")):
            if os.path.isdir(deps):                      # dependencies (affine, shapely, ...) installed separately
                sys.path.insert(1, deps)
                break
        break
else:
    sys.exit("Boxes.py not found: set BOXES_SRC (folder containing the 'boxes' sub-folder).")

import boxes.generators  # noqa: E402

LOCK = threading.Lock()                      # generators share global state: one at a time
TYPES = {"svg": "image/svg+xml", "pdf": "application/pdf", "dxf": "image/vnd.dxf", "ps": "application/postscript"}


def load_extra():
    """Load flexbox5plus.py (and any flexbox5*.py of this folder) under the name of its generator class."""
    extra = {}
    for fn in os.listdir(HERE):
        if fn.startswith("flexbox5") and fn.endswith(".py"):
            spec = importlib.util.spec_from_file_location("boxes.generators." + fn[:-3], os.path.join(HERE, fn))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            for name, obj in vars(mod).items():
                if isinstance(obj, type) and issubclass(obj, boxes.Boxes) and obj.__module__ == mod.__name__:
                    extra[name] = obj
    return extra


def generator(name):
    extra = load_extra()                     # reloaded on every call: flexbox5plus.py can be edited without restarting
    if name in extra:
        return extra[name]
    for g in boxes.generators.getAllBoxGenerators().values():
        if g.__name__ == name:
            return g
    raise KeyError(name)


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="text/plain; charset=utf-8", extra=None):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        name = u.path.strip("/")
        if name in ("", "ping"):
            return self._send(200, "ok")
        params = dict(parse_qsl(u.query, keep_blank_values=True))
        fmt = params.get("format", "svg")
        argv = ["--%s=%s" % (k, v) for k, v in params.items() if k not in ("language", "render", "format")] + ["--format=" + fmt]
        try:
            cls = generator(name)
            with LOCK:
                b = cls()
                b.parseArgs(argv)
                b.open()
                b.render()
                data = b.close()
            data = data.getvalue() if hasattr(data, "getvalue") else data
            return self._send(200, data, TYPES.get(fmt, "application/octet-stream"),
                              {"Content-Disposition": 'inline; filename="%s.%s"' % (name, fmt)})
        except KeyError:
            return self._send(404, "Unknown generator: " + name)
        except Exception as e:                # invalid setting, etc.: readable message in the browser
            traceback.print_exc()
            return self._send(400, "Generator error in %s: %s" % (name, e))

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    print("Local Boxes.py: http://127.0.0.1:%d/  (Ctrl+C to stop)" % PORT)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
