const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const list = await fileService.listProjects();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list projects: ' + err.message });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { title, format, logline, genre, actStructure, color } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    const meta = await fileService.createProject({
      title,
      format,
      logline,
      genre,
      actStructure,
      color
    });
    res.status(201).json(meta);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

// Get project meta details
router.get('/:slug', async (req, res) => {
  try {
    const meta = await fileService.getProjectMeta(req.params.slug);
    res.json(meta);
  } catch (err) {
    res.status(404).json({ error: 'Project not found: ' + err.message });
  }
});

// Update project metadata
router.put('/:slug', async (req, res) => {
  try {
    const updated = await fileService.updateProjectMeta(req.params.slug, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

// Delete project
router.delete('/:slug', async (req, res) => {
  try {
    const result = await fileService.deleteProject(req.params.slug);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project: ' + err.message });
  }
});

module.exports = router;
