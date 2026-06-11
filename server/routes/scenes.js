const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fileService = require('../services/fileService');

// Helper to get scenes file path
function getScenesPath(slug) {
  const root = fileService.getProjectsRoot();
  return path.join(root, slug, 'scenes.json');
}

// GET /api/projects/:slug/scenes
router.get('/:slug/scenes', async (req, res) => {
  try {
    const filePath = getScenesPath(req.params.slug);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'scenes.json not found' });
    }
    const data = await fs.promises.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read scenes: ' + err.message });
  }
});

// PUT /api/projects/:slug/scenes
router.put('/:slug/scenes', async (req, res) => {
  try {
    const filePath = getScenesPath(req.params.slug);
    const { version, acts, scenes } = req.body;
    
    if (!acts || !scenes) {
      return res.status(400).json({ error: 'Acts and Scenes lists are required' });
    }

    const payload = {
      version: version || '1.0',
      acts,
      scenes
    };

    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    
    // Also update sceneCount in project metadata
    await fileService.updateProjectMeta(req.params.slug, { sceneCount: scenes.length });
    
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save scenes: ' + err.message });
  }
});

// POST /api/projects/:slug/scenes/parse
// Parses story.md and suggests acts/scenes structure
router.post('/:slug/scenes/parse', async (req, res) => {
  try {
    const storyText = await fileService.getStory(req.params.slug);
    const lines = storyText.split('\n');
    
    const suggestedActs = [];
    const suggestedScenes = [];
    
    let currentActId = null;
    let currentScene = null;
    let sceneOrder = 0;
    let actOrder = 0;
    
    const actColors = ['#E8C547', '#D4742A', '#C24B2A', '#6B7FD4', '#4BA86B', '#7A6B8A', '#6B8A9E'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Act indicator (# Heading)
      if (line.startsWith('# ')) {
        actOrder++;
        currentActId = `act-${crypto.randomUUID().slice(0, 8)}`;
        suggestedActs.push({
          id: currentActId,
          label: line.slice(2).trim(),
          color: actColors[(actOrder - 1) % actColors.length],
          order: actOrder
        });
        currentScene = null; // reset scene context
      }
      
      // Scene indicator (## Heading)
      else if (line.startsWith('## ')) {
        sceneOrder++;
        
        // If we found a scene before an act was defined, create a default Act
        if (!currentActId) {
          actOrder++;
          currentActId = `act-${crypto.randomUUID().slice(0, 8)}`;
          suggestedActs.push({
            id: currentActId,
            label: 'Act ' + actOrder,
            color: actColors[(actOrder - 1) % actColors.length],
            order: actOrder
          });
        }
        
        currentScene = {
          id: crypto.randomUUID(),
          title: line.slice(3).trim(),
          synopsis: '',
          location: 'INT',
          locationName: 'SCENE ' + sceneOrder,
          timeOfDay: 'DAY',
          characters: [],
          tone: 'drama',
          act: currentActId,
          order: sceneOrder,
          color: '#6B7FD4',
          notes: '',
          conflictLevel: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        suggestedScenes.push(currentScene);
      }
      
      // Text paragraph contributing to synopsis of the active scene
      else if (line.length > 0 && currentScene) {
        // Exclude format lines or markdown decorators
        if (!line.startsWith('>') && !line.startsWith('*') && !line.startsWith('_')) {
          if (currentScene.synopsis) {
            currentScene.synopsis += ' ' + line;
          } else {
            currentScene.synopsis = line;
          }
        }
      }
    }
    
    // If no acts/scenes were parsed (empty or unstructured document), return a default template
    if (suggestedActs.length === 0 && suggestedScenes.length === 0) {
      suggestedActs.push({
        id: 'act-1',
        label: 'Act 1',
        color: '#E8C547',
        order: 1
      });
      suggestedScenes.push({
        id: crypto.randomUUID(),
        title: 'Opening Scene',
        synopsis: 'Write what happens in the first scene here...',
        location: 'INT',
        locationName: 'NEW LOCATION',
        timeOfDay: 'DAY',
        characters: [],
        tone: 'drama',
        act: 'act-1',
        order: 1,
        color: '#6B7FD4',
        notes: '',
        conflictLevel: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    res.json({
      acts: suggestedActs,
      scenes: suggestedScenes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse story: ' + err.message });
  }
});

module.exports = router;
