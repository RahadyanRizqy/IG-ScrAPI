const { 
  handlePosts, 
  handleScrape, 
  handleMediaAltUrl, 
  handleApiStatus,  
  handleCheckToken,
} = require('../handlers/handlers');

module.exports = function callRoutes(fastify, browser) {
  // Grouping prefix /api
  fastify.get('/api', (_, reply) => { reply.code(302).redirect('/api/status');});

  fastify.register(async function (apiRoutes) {
    // GET
    apiRoutes.get('/posts', async (req, res) => handlePosts(req, res, browser)); // TOKEN VIA URL
    apiRoutes.get('/scrape', async (req, res) => handleScrape(req, res, browser)); // TOKEN VIA URL
    apiRoutes.get('/check_token', async (req, res) => handleCheckToken(req, res)); // TOKEN VIA URL
    apiRoutes.get('/status', handleApiStatus);
    apiRoutes.get('/media/:code', handleMediaAltUrl);
    
    // POST
    apiRoutes.post('/posts', async (req, res) => handlePosts(req, res, browser)); // TOKEN VIA HEADER
    apiRoutes.post('/scrape', async (req, res) => handleScrape(req, res, browser)); // TOKEN VIA HEADER
    apiRoutes.post('/check_token', async (req, res) => handleCheckToken(req, res)); // TOKEN VIA JSON

  }, { prefix: '/api' });
};