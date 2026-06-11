const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');

// Helper to get screenplay path
function getScreenplayPath(slug) {
  const root = fileService.getProjectsRoot();
  return path.join(root, slug, 'screenplay.json');
}

// GET /api/projects/:slug/screenplay
router.get('/:slug/screenplay', async (req, res) => {
  try {
    const filePath = getScreenplayPath(req.params.slug);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'screenplay.json not found' });
    }
    const data = await fs.promises.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read screenplay: ' + err.message });
  }
});

// PUT /api/projects/:slug/screenplay
router.put('/:slug/screenplay', async (req, res) => {
  try {
    const filePath = getScreenplayPath(req.params.slug);
    const { elements, title, author, draftNumber, revisionHistory } = req.body;

    if (!elements) {
      return res.status(400).json({ error: 'Screenplay elements list is required' });
    }

    const payload = {
      version: '1.0',
      title: title || 'Untitled Screenplay',
      author: author || '',
      draftNumber: draftNumber || 1,
      elements,
      revisionHistory: revisionHistory || []
    };

    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save screenplay: ' + err.message });
  }
});

module.exports = router;
