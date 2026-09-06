const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const APK_PATH = path.join(__dirname, 'release', 'gigahub-mobile.apk');

const server = http.createServer((req, res) => {
    if (req.url === '/gigahub-mobile.apk' || req.url === '/download') {
        if (!fs.existsSync(APK_PATH)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Arquivo APK não encontrado.');
        }

        const stat = fs.statSync(APK_PATH);
        res.writeHead(200, {
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Length': stat.size,
            'Content-Disposition': 'attachment; filename="gigahub-mobile.apk"'
        });

        const stream = fs.createReadStream(APK_PATH);
        return stream.pipe(res);
    }

    // Página HTML amigável para celular com botão gigante de download
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GigaHub Mobile - Atualização</title>
            <style>
                body {
                    margin: 0;
                    padding: 24px;
                    background: #0b141a;
                    color: #fff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justifyContent: center;
                    min-height: 80vh;
                    text-align: center;
                }
                .card {
                    background: #111b21;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 32px 24px;
                    max-width: 360px;
                    width: 100%;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                h1 { margin: 0 0 8px 0; font-size: 1.5rem; color: #fff; }
                p { color: #8696a0; font-size: 0.9rem; margin-bottom: 24px; }
                .btn {
                    display: inline-block;
                    width: 100%;
                    box-sizing: border-box;
                    padding: 16px;
                    background: #00a884;
                    color: #fff;
                    text-decoration: none;
                    font-weight: 800;
                    font-size: 1.1rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 14px rgba(0, 168, 132, 0.4);
                }
                .badge {
                    display: inline-block;
                    margin-top: 16px;
                    font-size: 0.75rem;
                    color: #ff8800;
                    background: rgba(255,102,0,0.12);
                    padding: 4px 10px;
                    border-radius: 999px;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div style="font-size: 3rem; margin-bottom: 12px;">📱</div>
                <h1>Atualizar GigaHub</h1>
                <p>Versão atualizada com Funil / Kanban fidedigno ao desktop.</p>
                <a href="/gigahub-mobile.apk" class="btn">⬇️ Baixar APK Atualizado</a>
                <div class="badge">Versão 1.0.0 • 4.76 MB</div>
            </div>
        </body>
        </html>
    `);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[DOWNLOAD-SERVER] Servidor ativo em http://0.0.0.0:${PORT}`);
});
