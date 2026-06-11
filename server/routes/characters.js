const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');

// Helper to get characters.json path
function getCharactersPath(slug) {
  const root = fileService.getProjectsRoot();
  return path.join(root, slug, 'characters.json');
}

// GET /api/projects/:slug/characters
router.get('/:slug/characters', async (req, res) => {
  try {
    const filePath = getCharactersPath(req.params.slug);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'characters.json not found' });
    }
    const data = await fs.promises.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read characters: ' + err.message });
  }
});

// PUT /api/projects/:slug/characters
router.put('/:slug/characters', async (req, res) => {
  try {
    const filePath = getCharactersPath(req.params.slug);
    const { characters } = req.body;

    if (!characters) {
      return res.status(400).json({ error: 'Characters list is required' });
    }

    const payload = {
      characters
    };

    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save characters: ' + err.message });
  }
});

module.exports = router;
