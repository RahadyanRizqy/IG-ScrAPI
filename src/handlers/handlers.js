const { 
    mimeMap, 
    formatTimestamp, 
    generateShortCode, 
    generateHtmlResult, 
    validateUrl, 
    createPageContext,
    mediaExtractor 
} = require('../core/helpers');

const { scrapePage } = require('../core/scrape');

const {
  createCache,
  readCache,
  createShort,
  readShortByDest,
  readDestByShort,
  readShortByCacheId,
  readToken
} = require('../../database');

const { verifyToken } = require('../core/token');

async function handleScrape(request, reply, browser) {
    const givenUrl = request.body?.url || request.query?.url;
    const timestamp = formatTimestamp();

    try {
        if (!givenUrl) {
            throw new Error('Testing token?');
        }
        const post_id = validateUrl(givenUrl)[2];
        const cached = readCache(post_id);

        if (cached) {
            const item = JSON.parse(cached.cached_data);
            return reply.code(200).send({ 
                success: true, 
                timestamp, 
                user_details: 
                request.userDetails, 
                scraped_data: item 
            });
        }

        const { context, page } = await createPageContext(browser, givenUrl);
        const item = await scrapePage(page);
        await context.close();

        createCache({
            post_id,
            cached_data: item,
            token_id: request.userDetails.id,
            created_at: timestamp,
        });

        return reply.code(200).send({ 
            success: true, 
            timestamp, 
            user_details: 
            request.userDetails, 
            scraped_data: item 
        });
    } catch (err) {
        console.error(err);
        return reply.code(400).send({ success: false, error: err.message });
    }
}

async function handlePosts(request, reply, browser) {
    const givenUrl = request.body?.url || request.query?.url;
    const timestamp = formatTimestamp();
    let context;
    
    try {
        if (!givenUrl) {
            throw new Error('Testing token?');
        }

        const post_id = validateUrl(givenUrl)[2];
        let item = null;
        const cached = readCache(post_id);

        if (cached) {
            item = JSON.parse(cached.cached_data);
        } else {
            const init = await createPageContext(browser, givenUrl);
            context = init.context;
            item = await scrapePage(init.page);

            createCache({
                post_id,
                cached_data: item,
                token_id: request.userDetails.id,
                created_at: timestamp,
            });
        }

        const mediaItems = Array.isArray(mediaExtractor(item))
            ? mediaExtractor(item)
            : [mediaExtractor(item)];

        const existingShorts = readShortByCacheId(post_id); // Ambil semua short berdasarkan post_id

        let finalMedia = [];

        if (Array.isArray(existingShorts) && existingShorts.length > 0) {
            // Sudah ada data short sebelumnya, gunakan yang ada
            const destToShortMap = {};
            for (const short of existingShorts) {
                destToShortMap[short.dest] = short.short;
            }

            finalMedia = mediaItems.map((media) => {
                const alt = destToShortMap[media.url];
                const alt_url_full = `${request.getBaseUrl()}/api/media/${alt}`;

                return {
                    type: media.type,
                    alt_url: alt_url_full,
                    url: media.url,
                    width: media.width,
                    height: media.height,
                };
            });
        } else {
            // Belum ada data short, buat semuanya
            finalMedia = await Promise.all(
                mediaItems.map(async (media) => {
                    const alt = generateShortCode(media.url);

                    await createShort({
                        short: alt,
                        dest: media.url,
                        cache_id: post_id,
                    });

                    const alt_url_full = `${request.getBaseUrl()}/api/media/${alt}`;

                    return {
                        type: media.type,
                        alt_url: alt_url_full,
                        url: media.url,
                        width: media.width,
                        height: media.height,
                    };
                })
            );
        }

        const finalResult = {
            success: true,
            fetch: cached ? 'cache' : 'direct',
            timestamp,
            user_details: request.userDetails,
            data: {
                instagram_url: givenUrl,
                caption: item.caption?.text || null,
                owner: item.owner?.username || null,
                post_id: item.post_id,
                media: finalMedia.length === 1 ? finalMedia[0] : finalMedia,
            },
        };


        if ('html' in request.query) {
            return reply.code(200).type('text/html').send(generateHtmlResult(finalResult));
        }
        return reply.code(200).send(finalResult);

    } catch (err) {
        return reply.code(500).send({ success: false, error: err.message });
    } finally {
        if (context) await context.close();
    }
}


function handleMediaAltUrl(request, reply) {
    const { code } = request.params;
    const url = readDestByShort(code);
    if (url) {
        reply.redirect(url);
    } else {
        reply.code(404).send({
            success: false,
            error: 'Media not found'
        });
    }
}

async function handleApiStatus(_, reply) {
    label = 'API Status';
    message = 'API is running';

    htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${label}</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: black; }
            h2 { margin: 0; color: white; }
            
        </style>
    </head>
    <body>
        <h2>${message}</h2>
    </body>
    </html>`;
    return reply.code(200).type('text/html').send(htmlContent);
};

async function handleCheckToken(request, reply) {
    const token = request.body?.token || request.query?.token;
    try {
        const decoded = verifyToken(token);
        const isFound = readToken(token);

        if (!isFound) {
            throw new Error('Invalid or expired token');
        }

        const duration = decoded.exp && decoded.iat ? (decoded.exp - decoded.iat) : null;

        const userDetails = {
            id: isFound.id,
            username: decoded.username,
            issued_at: decoded.iat,
            expired_at: decoded.exp,
            duration: duration ?? '0',
            // token: token
        };

        return reply.code(200).send(userDetails);
    } catch (err) {
        reply.status(500).send({ error: err.message });
    }
}

module.exports = {
    handlePosts,
    handleScrape,
    handleMediaAltUrl,
    handleApiStatus,
    handleCheckToken
}