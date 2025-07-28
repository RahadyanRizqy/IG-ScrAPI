const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const configEnv = require('../config');

const mimeMap = new Map();

function formatTimestamp() {
    const d = new Date();
    return d.toISOString().replace('T', ' ').substring(0, 19);
}

function generateShortCode(url, length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const hash = crypto.createHash('sha256').update(url).digest();
    let code = '';
    for (let i = 0; code.length < length && i < hash.length; i++) {
        code += chars[hash[i] % chars.length];
    }
    return code;
}

function generateHtmlResult(_result) {
    const apiLabel = 'HTML Result';
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${apiLabel}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            a { color: blue; text-decoration: underline; }
            ul { padding-left: 20px; }
            li { margin-bottom: 20px; }
            img, video { max-width: 100%; height: auto; margin-top: 10px; display: block; }
        </style>
    </head>
    <body>
        <h2>${apiLabel}</h2>
        <p><strong>Success:</strong> ${_result.success}</p>
        <p><strong>Instagram URL:</strong> 
            <a href="${_result.data.instagramUrl}" target="_blank">${_result.data.instagramUrl}</a>
        </p>
        <p><strong>Owner:</strong> <a href="https://www.instagram.com/${_result.data.owner}/" target="_blank">${_result.data.owner}</a><br></p>
        <p><strong>Caption:</strong> ${_result.data.caption || 'No caption available'}</p>

        <h3>Content:</h3>
        <ul>
            ${Array.isArray(_result.data.media)
              ? _result.data.media.map((item, index) => {
                  return `
                    <li>
                        <strong>Type:</strong> ${item.type}<br>
                        <strong>Width x Height:</strong> ${item.width} x ${item.height}<br>
                        <strong>Alternative URL:</strong> 
                            <a href="${item.altUrl}" target="_blank">${item.altUrl}</a><br>
                        <strong>Media URL:</strong> 
                            <a href="${item.url}" target="_blank">${item.url}</a><br>
                    </li>
                  `;
              }).join('')
              : `
                <li>
                    <strong>Type:</strong> ${_result.data.media.type}<br>
                    <strong>Width x Height:</strong> ${_result.data.media.width} x ${_result.data.media.height}<br>
                    <strong>Alternative URL:</strong> 
                        <a href="${_result.data.media.altUrl}" target="_blank">${_result.data.media.altUrl}</a><br>
                    <strong>Media URL:</strong> 
                        <a href="${_result.data.media.url}" target="_blank">${_result.data.media.url}</a><br>
                </li>
              `
            }
        </ul>

        <p><strong>Timestamp:</strong> ${_result.timestamp}</p>
    </body>
    </html>`;
}


function getBaseUrl(request) {
    const protocol = request.headers['x-forwarded-proto'] || request.protocol;
    const host = request.headers['host'];

    const [hostname, port] = host.split(':');

    const isDefaultPort =
        (protocol === 'http' && (!port || port === '80')) ||
        (protocol === 'https' && (!port || port === '443'));

    return isDefaultPort
        ? `${protocol}://${hostname}`
        : `${protocol}://${hostname}:${port}`;
}

function getMainUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;
        return `https://www.instagram.com${pathname}`;
    } catch (err) {
        throw new Error(err)
    }
}

// helpers.js
function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL');
    }

    const match = url.match(/\/(p|reel)\/([a-zA-Z0-9_-]+)/);
    if (!match || !match[2]) {
        throw new Error('URL must contain Instagram post or reel ID');
    }

    return match; // [0] for p [1] for type [2] for ID
};

async function createPageContext(browser, url) {
    const context = await browser.newContext({
        storageState: path.resolve(configEnv.sessionJson),
    });
    const page = await context.newPage();
    await page.goto(getMainUrl(url), { waitUntil: 'domcontentloaded' });
    return { context, page };
};


function mediaExtractor(item) {
    const extractMedia = (media) => {
        const bestImage = media.image_versions2?.candidates?.reduce((best, current) => 
            (current.height * current.width > (best?.height * best?.width || 0)) ? current : best, null);
        
        if (media.media_type === 1) {
            return {
                type: "image",
                url: bestImage?.url,
                width: bestImage?.width,
                height: bestImage?.height
            };
        }
        
        const bestVideo = media.video_versions?.reduce((best, current) => 
            (current.height * current.width > (best?.height * best?.width || 0)) ? current : best, null);
            
        return {
            type: "video",
            url: bestVideo?.url,
            thumbUrl: bestImage?.url,
            width: bestVideo?.width,
            height: bestVideo?.height
        };
    };

    return item.carousel_media_count == null 
        ? extractMedia(item) 
        : item.carousel_media.map(extractMedia);
}


module.exports = {
    mimeMap,
    formatTimestamp,
    generateShortCode,
    generateHtmlResult,
    getBaseUrl,
    validateUrl,
    createPageContext,
    mediaExtractor,
}