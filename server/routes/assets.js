const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');

// Multer storage setup to write directly into target project folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const slug = req.params.slug;
    const root = fileService.getProjectsRoot();
    const projectDir = path.join(root, slug);
    const assetDir = path.join(projectDir, 'assets');
    
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }
    cb(null, assetDir);
  },
  filename: function (req, file, cb) {
    // Overwrite existing files of the same name (standard for sketches)
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// POST /api/projects/:slug/assets
// Expects field 'file' in multipart form data
router.post('/:slug/assets', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    
    const relativePath = `assets/${req.file.filename}`;
    res.status(201).json({
      filename: req.file.filename,
      path: relativePath,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload asset: ' + err.message });
  }
});

// DELETE /api/projects/:slug/assets/:filename
router.delete('/:slug/assets/:filename', async (req, res) => {
  try {
    const slug = req.params.slug;
    const filename = req.params.filename;
    const root = fileService.getProjectsRoot();
    const assetPath = path.join(root, slug, 'assets', filename);

    if (fs.existsSync(assetPath)) {
      await fs.promises.unlink(assetPath);
      res.json({ success: true, message: `Deleted asset ${filename}` });
    } else {
      res.status(404).json({ error: 'Asset not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete asset: ' + err.message });
  }
});

module.exports = router;
