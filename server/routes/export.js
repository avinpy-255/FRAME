const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const fileService = require('../services/fileService');

// Simple Markdown to HTML parser
function mdToHtml(markdown) {
  if (!markdown) return '';
  let html = markdown;
  
  // Escape XML/HTML tags
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Headers
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  
  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Bold & Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Paragraphs
  const lines = html.split('\n');
  const paragraphs = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('</blockquote')) {
      return trimmed;
    }
    return `<p>${trimmed}</p>`;
  });
  
  return paragraphs.filter(p => p !== '').join('\n');
}

// Converts screenplay JSON elements to Fountain markup
function toFountain(screenplayElements, screenplay) {
  let fountainText = '';
  
  // Add title page metadata if available
  fountainText += `Title: ${screenplay.title || 'Untitled Screenplay'}\n`;
  if (screenplay.author) fountainText += `Author: ${screenplay.author}\n`;
  if (screenplay.contact) fountainText += `Contact: ${screenplay.contact}\n`;
  fountainText += `Draft: ${screenplay.draftNumber || 1}\n\n`;

  const bodyElements = screenplayElements.map(el => {
    switch(el.type) {
      case 'scene-heading': 
        return `\n${el.content.toUpperCase()}\n`;
      case 'action': 
        return el.content;
      case 'character': 
        return `\n${el.content.toUpperCase()}`;
      case 'dialogue': 
        return el.content;
      case 'parenthetical': 
        return `(${el.content})`;
      case 'transition': 
        return `\n${el.content.toUpperCase()}:\n`;
      case 'shot':
        return `\n${el.content.toUpperCase()}\n`;
      case 'note': 
        return `\n[[ ${el.content} ]]\n`;
      default: 
        return el.content;
    }
  }).join('\n');

  return fountainText + bodyElements;
}

// GET /api/projects/:slug/exports - List generated exports
router.get('/:slug/exports', async (req, res) => {
  const { slug } = req.params;
  try {
    const projectDir = path.join(fileService.getProjectsRoot(), slug);
    const exportDir = path.join(projectDir, 'exports');
    
    if (!fs.existsSync(exportDir)) {
      await fs.promises.mkdir(exportDir, { recursive: true });
    }
    
    const files = await fs.promises.readdir(exportDir);
    const exportsList = [];
    
    for (const file of files) {
      const filePath = path.join(exportDir, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isFile()) {
        exportsList.push({
          name: file,
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
          path: filePath.replace(/\\/g, '/')
        });
      }
    }
    
    res.json(exportsList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list exports: ' + err.message });
  }
});

// POST /api/projects/:slug/export/html - Compile Lookbook HTML
router.post('/:slug/export/html', async (req, res) => {
  const { slug } = req.params;
  const { includeStory, includeScenes, includeScreenplay, includeGallery } = req.body;
  
  try {
    const projectDir = path.join(fileService.getProjectsRoot(), slug);
    const metaPath = path.join(projectDir, 'meta.json');
    const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf8'));
    
    // Read Template
    const templatePath = path.join(__dirname, '../export-templates/lookbook.template.html');
    let html = await fs.promises.readFile(templatePath, 'utf8');
    
    // Replace Meta
    html = html
      .replace(/{{TITLE}}/g, meta.title)
      .replace(/{{FORMAT}}/g, meta.format || 'short-film')
      .replace(/{{LOGLINE}}/g, meta.logline || '')
      .replace(/{{AUTHOR}}/g, meta.author || 'Writer')
      .replace(/{{CONTACT}}/g, meta.contact || '');
      
    // 1. Story Section
    if (includeStory) {
      const storyPath = path.join(projectDir, 'story.md');
      const storyMd = fs.existsSync(storyPath) ? await fs.promises.readFile(storyPath, 'utf8') : '';
      const storyHtml = mdToHtml(storyMd);
      html = html.replace(/{{STORY_CLASS}}/g, '').replace(/{{STORY_CONTENT}}/g, storyHtml);
    } else {
      html = html.replace(/{{STORY_CLASS}}/g, 'hidden').replace(/{{STORY_CONTENT}}/g, '');
    }
    
    // 2. Scenes Section (Flipbook)
    if (includeScenes) {
      const scenesPath = path.join(projectDir, 'scenes.json');
      const scenesData = fs.existsSync(scenesPath) ? JSON.parse(await fs.promises.readFile(scenesPath, 'utf8')) : { scenes: [] };
      const scenesList = scenesData.scenes || [];
      
      let cardsHtml = '';
      scenesList.sort((a,b) => a.order - b.order);
      
      for (const scene of scenesList) {
        let sketchBase64 = '';
        if (scene.sketchPath) {
          const fullSketchPath = path.join(projectDir, scene.sketchPath);
          if (fs.existsSync(fullSketchPath)) {
            const buffer = await fs.promises.readFile(fullSketchPath);
            sketchBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
          }
        }
        
        cardsHtml += `
        <div class="lookbook-card">
          <div class="card-face front" style="border-top: 4px solid ${scene.color || 'var(--color-gold)'}">
            <div class="card-header">
              <span>${scene.timeOfDay || 'DAY'}</span>
              <span>${scene.location || 'INT'}</span>
            </div>
            <div>
              <div class="card-title">${scene.title || 'Untitled Scene'}</div>
              <div class="card-meta">${scene.locationName || ''}</div>
              <div class="card-img-placeholder">
                ${sketchBase64 ? `<img src="${sketchBase64}" alt="${scene.title}" />` : '<span>No Visual Sketch</span>'}
              </div>
            </div>
            <div class="card-cast">
              ${(scene.characters || []).map(c => `<span class="cast-chip">${c}</span>`).join('')}
            </div>
          </div>
          <div class="card-face back">
            <div>
              <div class="card-title">${scene.title || 'Untitled Scene'}</div>
              <div class="card-synopsis">${scene.synopsis || 'No synopsis added.'}</div>
              ${scene.notes ? `<div class="card-notes">${scene.notes}</div>` : ''}
            </div>
            <div class="card-footer-metrics">
              <span>Conflict Level</span>
              <div class="conflict-dots">
                ${Array.from({ length: 5 }, (_, i) => `<div class="conflict-dot ${i < (scene.conflictLevel || 0) ? 'filled' : ''}"></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        `;
      }
      
      html = html.replace(/{{FLIPBOOK_CLASS}}/g, '').replace(/{{FLIPBOOK_CARDS}}/g, cardsHtml);
    } else {
      html = html.replace(/{{FLIPBOOK_CLASS}}/g, 'hidden').replace(/{{FLIPBOOK_CARDS}}/g, '');
    }
    
    // 3. Screenplay Section
    if (includeScreenplay) {
      const screenplayPath = path.join(projectDir, 'screenplay.json');
      const screenplay = fs.existsSync(screenplayPath) ? JSON.parse(await fs.promises.readFile(screenplayPath, 'utf8')) : { elements: [] };
      const elements = screenplay.elements || [];
      
      let screenplayHtml = '';
      elements.forEach(el => {
        if (el.type === 'titlepage') {
          screenplayHtml += `
          <div class="sp-titlepage">
            <div class="sp-titlepage-title">${el.content}</div>
            <div style="margin-bottom: 2em;">Written by</div>
            <div style="font-weight: bold; margin-bottom: 2em;">${screenplay.author || meta.author || 'Writer'}</div>
            <div style="font-size: 10pt; color: #555555; white-space: pre-wrap;">${screenplay.contact || meta.contact || ''}</div>
          </div>
          `;
        } else {
          let className = 'sp-action';
          if (el.type === 'scene-heading') className = 'sp-scene-heading';
          else if (el.type === 'character') className = 'sp-character';
          else if (el.type === 'dialogue') className = 'sp-dialogue';
          else if (el.type === 'parenthetical') className = 'sp-parenthetical';
          else if (el.type === 'transition') className = 'sp-transition';
          else if (el.type === 'shot') className = 'sp-shot';
          else if (el.type === 'note') className = 'sp-note';
          
          screenplayHtml += `<div class="screenplay-element ${className}">${el.content}</div>`;
        }
      });
      
      html = html.replace(/{{SCREENPLAY_CLASS}}/g, '').replace(/{{SCREENPLAY_CONTENT}}/g, screenplayHtml);
    } else {
      html = html.replace(/{{SCREENPLAY_CLASS}}/g, 'hidden').replace(/{{SCREENPLAY_CONTENT}}/g, '');
    }
    
    // 4. Gallery Section
    if (includeGallery) {
      const scenesPath = path.join(projectDir, 'scenes.json');
      const scenesData = fs.existsSync(scenesPath) ? JSON.parse(await fs.promises.readFile(scenesPath, 'utf8')) : { scenes: [] };
      const scenesList = scenesData.scenes || [];
      
      let galleryHtml = '';
      for (const scene of scenesList) {
        if (scene.sketchPath) {
          const fullPath = path.join(projectDir, scene.sketchPath);
          if (fs.existsSync(fullPath)) {
            const buffer = await fs.promises.readFile(fullPath);
            const base64 = buffer.toString('base64');
            galleryHtml += `
            <div class="gallery-item">
              <div class="gallery-image-wrapper">
                <img src="data:image/png;base64,${base64}" alt="${scene.title}" />
              </div>
              <div class="gallery-meta">
                <div class="gallery-title">${scene.title} - Sketch</div>
                <div class="gallery-desc">${scene.locationName || ''}</div>
              </div>
            </div>
            `;
          }
        }
        if (scene.referencePath) {
          const fullPath = path.join(projectDir, scene.referencePath);
          if (fs.existsSync(fullPath)) {
            const buffer = await fs.promises.readFile(fullPath);
            const base64 = buffer.toString('base64');
            const ext = path.extname(scene.referencePath).slice(1);
            galleryHtml += `
            <div class="gallery-item">
              <div class="gallery-image-wrapper">
                <img src="data:image/${ext || 'jpeg'};base64,${base64}" alt="${scene.title}" />
              </div>
              <div class="gallery-meta">
                <div class="gallery-title">${scene.title} - Reference</div>
                <div class="gallery-desc">${scene.locationName || ''}</div>
              </div>
            </div>
            `;
          }
        }
      }
      
      html = html.replace(/{{GALLERY_CLASS}}/g, '').replace(/{{GALLERY_CONTENT}}/g, galleryHtml);
    } else {
      html = html.replace(/{{GALLERY_CLASS}}/g, 'hidden').replace(/{{GALLERY_CONTENT}}/g, '');
    }
    
    // Save Lookbook file
    const destPath = path.join(projectDir, 'exports', `${slug}.html`);
    await fs.promises.writeFile(destPath, html, 'utf8');
    
    res.json({ success: true, filename: `${slug}.html`, path: destPath.replace(/\\/g, '/') });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compile HTML lookbook: ' + err.message });
  }
});

// POST /api/projects/:slug/export/fountain - Compile Fountain document
router.post('/:slug/export/fountain', async (req, res) => {
  const { slug } = req.params;
  try {
    const projectDir = path.join(fileService.getProjectsRoot(), slug);
    const screenplayPath = path.join(projectDir, 'screenplay.json');
    
    if (!fs.existsSync(screenplayPath)) {
      return res.status(404).json({ error: 'Screenplay file not found' });
    }
    
    const screenplay = JSON.parse(await fs.promises.readFile(screenplayPath, 'utf8'));
    const elements = screenplay.elements || [];
    
    const fountainText = toFountain(elements, screenplay);
    
    const destPath = path.join(projectDir, 'exports', `${slug}.fountain`);
    await fs.promises.writeFile(destPath, fountainText, 'utf8');
    
    res.json({ success: true, filename: `${slug}.fountain`, path: destPath.replace(/\\/g, '/') });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate Fountain: ' + err.message });
  }
});

// Helper to find local system Chrome or Edge browser executable on Windows
function getChromiumPath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// POST /api/projects/:slug/export/pdf - Print screenplay PDF via Puppeteer
router.post('/:slug/export/pdf', async (req, res) => {
  const { slug } = req.params;
  const PORT = process.env.PORT || 3001;
  
  try {
    const projectDir = path.join(fileService.getProjectsRoot(), slug);
    const pdfPath = path.join(projectDir, 'exports', `${slug}.pdf`);
    
    const execPath = getChromiumPath();
    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (execPath) {
      launchOptions.executablePath = execPath;
      console.log(`Using system browser at: ${launchOptions.executablePath}`);
    }
    
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const printUrl = `http://localhost:${PORT}/print/${slug}/screenplay`;
    
    await page.goto(printUrl, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      margin: { top: '1in', right: '1in', bottom: '1in', left: '1.5in' },
      printBackground: false
    });
    
    await browser.close();
    
    res.json({ success: true, filename: `${slug}.pdf`, path: pdfPath.replace(/\\/g, '/') });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
  }
});

// POST /api/projects/:slug/snapshot - Create snapshot backup
router.post('/:slug/snapshot', async (req, res) => {
  const { slug } = req.params;
  try {
    const projectDir = path.join(fileService.getProjectsRoot(), slug);
    const snapshotDir = path.join(projectDir, 'snapshots');
    
    if (!fs.existsSync(snapshotDir)) {
      await fs.promises.mkdir(snapshotDir, { recursive: true });
    }
    
    // Gather all project state
    const filesToRead = ['meta.json', 'scenes.json', 'screenplay.json', 'characters.json', 'research.json'];
    const snapshotBundle = {
      timestamp: new Date().toISOString(),
      meta: {},
      story: '',
      scenes: {},
      screenplay: {},
      characters: {},
      research: {}
    };
    
    // Read JSON files
    for (const file of filesToRead) {
      const key = file.replace('.json', '');
      const filePath = path.join(projectDir, file);
      if (fs.existsSync(filePath)) {
        snapshotBundle[key] = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
      }
    }
    
    // Read Story Markdown
    const storyPath = path.join(projectDir, 'story.md');
    if (fs.existsSync(storyPath)) {
      snapshotBundle.story = await fs.promises.readFile(storyPath, 'utf8');
    }
    
    // Format timestamp safe for file names (Windows compatibility: replace colons)
    const timeSafe = new Date().toISOString().replace(/:/g, '-');
    const snapshotPath = path.join(snapshotDir, `${timeSafe}.json`);
    
    await fs.promises.writeFile(snapshotPath, JSON.stringify(snapshotBundle, null, 2), 'utf8');
    
    res.json({ success: true, filename: `${timeSafe}.json`, timestamp: snapshotBundle.timestamp });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create snapshot: ' + err.message });
  }
});

// GET /api/projects/:slug/snapshots - List snapshots list
router.get('/:slug/snapshots', async (req, res) => {
  const { slug } = req.params;
  try {
    const projectDir = path.join(fileService.getProjectsRoot(), slug);
    const snapshotDir = path.join(projectDir, 'snapshots');
    
    if (!fs.existsSync(snapshotDir)) {
      await fs.promises.mkdir(snapshotDir, { recursive: true });
    }
    
    const files = await fs.promises.readdir(snapshotDir);
    const snapshotList = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(snapshotDir, file);
        const stats = await fs.promises.stat(filePath);
        // Extract original timestamp from file name or stats
        const timestampStr = file.replace('.json', '').replace(/-/g, ':');
        snapshotList.push({
          name: file,
          timestamp: timestampStr,
          size: stats.size
        });
      }
    }
    
    // Sort by timestamp descending
    snapshotList.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(snapshotList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list snapshots: ' + err.message });
  }
});

module.exports = router;
