const { 
    verifyToken, 
    storeToken, 
    findToken 
} = require('../core/token');

const {
  createCache,
  readCache,
  createShort,
  readDestByShort,
  readToken
} = require('../../database');

const { URL } = require('url');

function formatUnixTimestamp(ts) {
    const date = new Date(ts * 1000); // ubah ke milidetik
    const pad = n => n.toString().padStart(2, '0');
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

module.exports = function createAuthHook() {
    return async function authHook(request, reply) {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const path = url.pathname;
        const method = request.method;

        // Route-route yang tidak butuh autentikasi sama sekali (benar-benar publik)
        const fullyPublicRoutes = [
            '/api/status',
            '/api/check_token',
            /^\/api\/media\/[^\/]+$/, // /api/media/:code
        ];

        // Route yang boleh menggunakan token via URL (GET)
        const getTokenInQueryRoutes = [
            '/api/posts',
            '/api/scrape',
        ];

        // Route yang menggunakan token di Header (POST)
        const postTokenInHeaderRoutes = [
            '/api/posts',
            '/api/scrape',
        ];

        // 1. Cek apakah rute termasuk benar-benar publik
        const isFullyPublic = fullyPublicRoutes.some(route =>
            typeof route === 'string' ? path === route : route.test(path)
        );

        if (isFullyPublic) return;


        // 2. Validasi format token sesuai jenis metode & route
        const authHeader = request.headers.authorization;
        const queryToken = request.query?.token;

        if (method === 'GET') {
            if (getTokenInQueryRoutes.includes(path)) {
                if (!queryToken) {
                    return reply.code(401).send({ error: 'Token required in query' });
                }
            } else {
                // console.log(path);
                // console.log(isFullyPublic);
                // console.log("GET here... Error...");
                return reply.code(403).send({ error: 'Forbidden' });
            }
        }

        if (method === 'POST') {
            if (postTokenInHeaderRoutes.includes(path)) {
                if (!authHeader) {
                    return reply.code(401).send({ error: 'Token required in header' });
                }
            } else {
                return reply.code(403).send({ error: 'Forbidden' });
            }
        }

        // 3. Ambil token sesuai sumber yang sesuai
        const token = method === 'GET'
            ? queryToken
            : (authHeader && authHeader.split(' ')[1]);

        if (!token) {
            return reply.code(401).send({ success: false, error: 'No token provided' });
        }

        // 4. Verifikasi token
        try {
            const decoded = verifyToken(token);
            const isFound = readToken(token);

            if (!isFound) {
                throw new Error('Invalid or expired token');
            }

            const duration = decoded.exp && decoded.iat ? (decoded.exp - decoded.iat) : null;

            request.userDetails = {
                id: isFound.id,
                username: decoded.username,
                issued_at: decoded.iat,
                expired_at: decoded.exp,
                duration: duration ?? '0',
                // token: token
            };
            return;
        } catch (err) {
            return reply.code(401).send({ success: false, error: err.message });
        }
    };
};

