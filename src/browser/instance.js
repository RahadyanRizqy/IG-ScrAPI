const createFastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const path = require('path');

const callRoutes = require('../web/routes');
const initBrowser = require('../browser/browser');
const createAuthHook = require('../web/auth_hook');

async function setupFastifyInstance(configEnv, isSocket = false) {
    const fastify = createFastify({ logger: configEnv.logger, trustProxy: true });

    const config = { ...configEnv, isSocket };
    fastify.decorate('config', config);

    fastify.decorateRequest('getBaseUrl', function () {
        return `${this.protocol}://${this.headers.host}`;
    });

    await fastify.register(cors, { origin: '*' });
    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '../public'),
        prefix: '/static/',
    });

    const authHook = createAuthHook();
    fastify.addHook('onRequest', authHook);

    const browser = await initBrowser(configEnv);
    callRoutes(fastify, browser);

    fastify.addHook('onClose', async () => {
        await browser.close();
    });

    fastify.setNotFoundHandler((req, reply) => {
        reply.status(404).send({ error: 'Route tidak ditemukan' });
    });

    fastify.setErrorHandler((error, request, reply) => {
        console.error('❌ [Unhandled Error]', 'ERROR!!!'); // MUST BE LOGGED HERE
        reply.status(500).send({
            error: 'Internal Server Error',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    });

    return fastify;
}

module.exports = setupFastifyInstance;