const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const projectsRouter = require('./routes/projects');
const storyRouter = require('./routes/story');
const settingsRouter = require('./routes/settings');
const scenesRouter = require('./routes/scenes');
const assetsRouter = require('./routes/assets');
const screenplayRouter = require('./routes/screenplay');
const charactersRouter = require('./routes/characters');
const researchRouter = require('./routes/research');
const aiRouter = require('./routes/ai');
const exportRouter = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve project assets statically if needed
// Access via /api/projects/:slug/assets/:filename
app.get('/api/projects/:slug/assets/:filename', (req, res) => {
  const fileService = require('./services/fileService');
  const projectDir = path.join(fileService.getProjectsRoot(), req.params.slug);
  const assetPath = path.join(projectDir, 'assets', req.params.filename);

  if (fs.existsSync(assetPath)) {
    return res.sendFile(assetPath);
  } else {
    return res.status(404).json({ error: 'Asset not found' });
  }
});

// Clean print view endpoint for Puppeteer PDF printing
app.get('/print/:slug/screenplay', async (req, res) => {
  const { slug } = req.params;
  try {
    const fileService = require('./services/fileService');
    const projectDir = path.join(fileService.getProjectsRoot(), slug);
    const screenplayPath = path.join(projectDir, 'screenplay.json');
    
    if (!fs.existsSync(screenplayPath)) {
      return res.status(404).send('<h1>Screenplay file not found</h1>');
    }
    
    const screenplay = JSON.parse(await fs.promises.readFile(screenplayPath, 'utf8'));
    const elements = screenplay.elements || [];
    
    let elementsHtml = '';
    elements.forEach(el => {
      if (el.type === 'titlepage') {
        elementsHtml += `
        <div class="sp-titlepage">
          <div class="sp-titlepage-title">${el.content}</div>
          <div style="margin-bottom: 2em;">Written by</div>
          <div style="font-weight: bold; margin-bottom: 2em;">${screenplay.author || 'Writer'}</div>
          <div style="font-size: 10pt; color: #555555; white-space: pre-wrap;">${screenplay.contact || ''}</div>
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
        
        elementsHtml += `<div class="screenplay-element ${className}">${el.content}</div>`;
      }
    });

    const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${screenplay.title || 'Screenplay'}</title>
      <style>
        @page {
          size: letter;
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12pt;
          line-height: 1.2;
          color: #000000;
          background-color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .screenplay-print-container {
          padding: 1in 1in 1in 1.5in;
        }
        .screenplay-element {
          margin-bottom: 1.2em;
          white-space: pre-wrap;
        }
        .sp-scene-heading {
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 2em;
          margin-bottom: 1em;
          page-break-after: avoid;
        }
        .sp-action {
          margin-bottom: 1.2em;
        }
        .sp-character {
          text-align: center;
          text-transform: uppercase;
          margin-left: 2.2in;
          margin-bottom: 0.2em;
          margin-top: 1.2em;
          page-break-after: avoid;
        }
        .sp-dialogue {
          margin-left: 1in;
          margin-right: 1in;
          margin-bottom: 1.2em;
        }
        .sp-parenthetical {
          margin-left: 1.5in;
          margin-right: 1.5in;
          margin-bottom: 0.2em;
          page-break-after: avoid;
        }
        .sp-transition {
          text-align: right;
          text-transform: uppercase;
          margin-left: 3.5in;
          margin-bottom: 1.2em;
          margin-top: 1.5em;
        }
        .sp-shot {
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 1.5em;
        }
        .sp-titlepage {
          text-align: center;
          padding-top: 2.5in;
          height: 100vh;
          page-break-after: always;
          box-sizing: border-box;
        }
        .sp-titlepage-title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 2em;
          text-transform: uppercase;
        }
        .sp-note {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="screenplay-print-container">
        ${elementsHtml}
      </div>
    </body>
    </html>
    `;
    
    res.send(printHtml);
  } catch (err) {
    res.status(500).send(`<h1>Failed to load print screenplay: ${err.message}</h1>`);
  }
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/projects', storyRouter);
app.use('/api/projects', scenesRouter);
app.use('/api/projects', assetsRouter);
app.use('/api/projects', screenplayRouter);
app.use('/api/projects', charactersRouter);
app.use('/api/projects', researchRouter);
app.use('/api/projects', exportRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settings', settingsRouter);

// Serve client built static files in production
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  console.log(`Serving static files from client build: ${clientDistPath}`);
  
  // SPA routing fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`FRAME Backend Server listening on http://localhost:${PORT}`);
  
  // Initialize folders and settings if missing on startup
  try {
    const fileService = require('./services/fileService');
    const root = fileService.getProjectsRoot();
    console.log(`Projects directory is set to: ${root}`);
  } catch (err) {
    console.error('Failed to initialize projects directory on startup:', err);
  }
});
