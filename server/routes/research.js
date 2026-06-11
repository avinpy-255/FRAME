const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const fileService = require('../services/fileService');

// Helper to get research.json path
function getResearchPath(slug) {
  const root = fileService.getProjectsRoot();
  return path.join(root, slug, 'research.json');
}

// Scrape HTML content helper
function fetchHtml(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 3000
    };

    const req = client.get(urlStr, options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, urlStr).toString();
        }
        return resolve(fetchHtml(redirectUrl));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Extract tags helper
function parseHtmlMetadata(urlStr, html) {
  const url = new URL(urlStr);
  const domain = url.hostname;

  const getTag = (regex) => {
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };

  // Extract <title>
  const title = getTag(/<title[^>]*>([\s\S]*?)<\/title>/i) || domain;

  // Extract Open Graph / description meta tags
  // Regex supports varied attribute orders
  const ogTitle = getTag(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i) ||
                  getTag(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:title["']/i);

  const desc = getTag(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i) ||
               getTag(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i);

  const ogImage = getTag(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i);

  return {
    title: ogTitle || title,
    description: desc || 'Pasted URL bookmark.',
    image: ogImage || null,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  };
}

// GET /api/projects/:slug/research
router.get('/:slug/research', async (req, res) => {
  try {
    const filePath = getResearchPath(req.params.slug);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'research.json not found' });
    }
    const data = await fs.promises.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read research: ' + err.message });
  }
});

// PUT /api/projects/:slug/research
router.put('/:slug/research', async (req, res) => {
  try {
    const filePath = getResearchPath(req.params.slug);
    const { items, boards } = req.body;

    if (!items || !boards) {
      return res.status(400).json({ error: 'Items and Boards configurations are required' });
    }

    const payload = {
      items,
      boards
    };

    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save research: ' + err.message });
  }
});

// POST /api/projects/:slug/research/scrape
router.post('/:slug/research/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const html = await fetchHtml(url);
    const meta = parseHtmlMetadata(url, html);
    res.json(meta);
  } catch (err) {
    // Graceful fallback to domain name on error/timeout
    try {
      const domain = new URL(url).hostname;
      res.json({
        title: domain,
        description: 'Bookmark saved.',
        image: null,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      });
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL provided' });
    }
  }
});

module.exports = router;
