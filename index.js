const fs = require('fs');
const configEnv = require('./src/config');

const isWindows = process.platform === 'win32';
const socketPath = isWindows ? '\\\\.\\pipe\\myapisocket' : configEnv.unixSockPath;
const setupFastifyInstance = require('./src/browser/instance');

if (!isWindows && fs.existsSync(socketPath)) {
    try {
        fs.unlinkSync(socketPath);
    } catch (e) {
        console.error('❌ Gagal menghapus socket lama:', e.message);
    }
}

(async () => {
    // 🔌 Jalankan HTTP API
    if (configEnv.restApi) {
        const httpServer = await setupFastifyInstance(configEnv, false);
        httpServer.listen({ port: configEnv.port, host: configEnv.host })
            .then(addr => console.log(`🚀 HTTP API listening at ${addr}`))
            .catch(err => {
                console.error('❌ Gagal listen HTTP:', err);
                process.exit(1);
            });
    }

    // 🔌 Jalankan Unix Socket / Named Pipe
    if (configEnv.socket) {
        const socketServer = await setupFastifyInstance(configEnv, true);
        socketServer.listen({ path: socketPath })
            .then(() => {
                if (!isWindows) fs.chmodSync(socketPath, 0o766);
                console.log(`✅ Socket aktif di ${socketPath}`);
            })
            .catch(err => {
                console.error('❌ Gagal listen socket:', err);
            });
    }
})();