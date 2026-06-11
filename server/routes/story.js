const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');

// Read story.md
router.get('/:slug/story', async (req, res) => {
  try {
    const text = await fileService.getStory(req.params.slug);
    res.json({ text });
  } catch (err) {
    res.status(404).json({ error: 'Story file not found: ' + err.message });
  }
});

// Write story.md
router.put('/:slug/story', async (req, res) => {
  try {
    const { text } = req.body;
    if (text === undefined) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    const result = await fileService.updateStory(req.params.slug, text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update story: ' + err.message });
  }
});

module.exports = router;
