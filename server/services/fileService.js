const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Resolve standard home directory alias (~)
function resolveHome(filepath) {
  if (!filepath) return '';
  if (filepath.startsWith('~')) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return path.resolve(filepath);
}

// App configuration path
const configDir = path.join(os.homedir(), '.frame');
const configPath = path.join(configDir, 'config.json');

// Ensure base config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Get global config
function getConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  // Return default config if not readable
  return {
    projectsRoot: '~/frame-projects',
    theme: 'dark',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    aiEnabled: true,
    autosaveInterval: 5000,
    defaultActStructure: 'three-act',
    fontScale: 1.0,
    recentProjects: []
  };
}

// Write global config
function updateConfig(newConfig) {
  try {
    const current = getConfig();
    const merged = { ...current, ...newConfig };
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (err) {
    console.error('Error updating config file:', err);
    throw err;
  }
}

// Get project workspace root folder
function getProjectsRoot() {
  const config = getConfig();
  const resolved = resolveHome(config.projectsRoot || '~/frame-projects');
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
}

// Helper to get slug directory absolute path
function getProjectDir(slug) {
  const root = getProjectsRoot();
  return path.join(root, slug);
}

// List all projects
async function listProjects() {
  const root = getProjectsRoot();
  try {
    const files = await fs.promises.readdir(root, { withFileTypes: true });
    const projects = [];

    for (const file of files) {
      if (file.isDirectory()) {
        const metaFilePath = path.join(root, file.name, 'meta.json');
        if (fs.existsSync(metaFilePath)) {
          try {
            const metaContent = await fs.promises.readFile(metaFilePath, 'utf8');
            projects.push(JSON.parse(metaContent));
          } catch (e) {
            console.error(`Error reading meta.json for project ${file.name}:`, e);
          }
        }
      }
    }

    // Sort by updatedAt descending
    return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (err) {
    console.error('Error listing projects:', err);
    return [];
  }
}

// Create slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Create new project folder and boilerplate files
async function createProject({ title, format, logline, genre, actStructure, color, coverImage }) {
  const root = getProjectsRoot();
  let slug = generateSlug(title || 'untitled');
  if (!slug) slug = 'project';

  let projectDir = path.join(root, slug);
  let counter = 1;
  while (fs.existsSync(projectDir)) {
    projectDir = path.join(root, `${slug}-${counter}`);
    counter++;
  }
  const finalSlug = path.basename(projectDir);

  // Create subfolders
  await fs.promises.mkdir(projectDir, { recursive: true });
  await fs.promises.mkdir(path.join(projectDir, 'assets'), { recursive: true });
  await fs.promises.mkdir(path.join(projectDir, 'exports'), { recursive: true });
  await fs.promises.mkdir(path.join(projectDir, 'snapshots'), { recursive: true });

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // Create default meta.json
  const meta = {
    id,
    slug: finalSlug,
    title: title || 'Untitled Project',
    logline: logline || '',
    synopsis: '',
    genre: Array.isArray(genre) ? genre : (genre ? [genre] : []),
    format: format || 'short-film',
    status: 'development',
    actStructure: actStructure || 'three-act',
    color: color || '#E8C547',
    coverImage: coverImage || '',
    createdAt: now,
    updatedAt: now,
    wordCount: 0,
    sceneCount: 0,
    estimatedRuntime: 0,
    tags: []
  };

  // Pre-populate acts based on structure
  const acts = [];
  if (meta.actStructure === 'three-act') {
    acts.push(
      { id: 'act-1', label: 'Act 1 (Setup)', color: '#E8C547', order: 1 },
      { id: 'act-2', label: 'Act 2 (Confrontation)', color: '#6B7FD4', order: 2 },
      { id: 'act-3', label: 'Act 3 (Resolution)', color: '#C24B2A', order: 3 }
    );
  } else if (meta.actStructure === 'five-act') {
    acts.push(
      { id: 'act-1', label: 'Act 1 (Exposition)', color: '#E8C547', order: 1 },
      { id: 'act-2', label: 'Act 2 (Rising Action)', color: '#D4742A', order: 2 },
      { id: 'act-3', label: 'Act 3 (Climax)', color: '#C24B2A', order: 3 },
      { id: 'act-4', label: 'Act 4 (Falling Action)', color: '#6B7FD4', order: 4 },
      { id: 'act-5', label: 'Act 5 (Resolution)', color: '#4BA86B', order: 5 }
    );
  } else {
    acts.push({ id: 'act-1', label: 'Act 1', color: '#E8C547', order: 1 });
  }

  const scenes = {
    version: '1.0',
    acts,
    scenes: []
  };

  const screenplay = {
    version: '1.0',
    title: meta.title,
    author: '',
    contact: '',
    draftNumber: 1,
    elements: [
      {
        id: crypto.randomUUID(),
        sceneId: null,
        type: 'titlepage',
        content: meta.title.toUpperCase(),
        order: 0,
        locked: false,
        revisionMark: 'none',
        notes: ''
      }
    ],
    revisionHistory: [
      {
        draftNumber: 1,
        date: now,
        changes: 0
      }
    ]
  };

  const characters = { characters: [] };
  const research = { items: [], boards: [] };

  const storyMd = `# ${meta.title}\n\nWrite your story treatment here...\n`;

  // Write all baseline files
  await fs.promises.writeFile(path.join(projectDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
  await fs.promises.writeFile(path.join(projectDir, 'scenes.json'), JSON.stringify(scenes, null, 2), 'utf8');
  await fs.promises.writeFile(path.join(projectDir, 'screenplay.json'), JSON.stringify(screenplay, null, 2), 'utf8');
  await fs.promises.writeFile(path.join(projectDir, 'characters.json'), JSON.stringify(characters, null, 2), 'utf8');
  await fs.promises.writeFile(path.join(projectDir, 'research.json'), JSON.stringify(research, null, 2), 'utf8');
  await fs.promises.writeFile(path.join(projectDir, 'story.md'), storyMd, 'utf8');

  // Update config recent list
  const config = getConfig();
  let recents = config.recentProjects || [];
  recents = [finalSlug, ...recents.filter(s => s !== finalSlug)].slice(0, 5);
  updateConfig({ recentProjects: recents });

  return meta;
}

// Get single project meta
async function getProjectMeta(slug) {
  const metaPath = path.join(getProjectDir(slug), 'meta.json');
  const data = await fs.promises.readFile(metaPath, 'utf8');
  return JSON.parse(data);
}

// Update project metadata
async function updateProjectMeta(slug, metaData) {
  const projectDir = getProjectDir(slug);
  const metaPath = path.join(projectDir, 'meta.json');
  const existing = await getProjectMeta(slug);
  const updated = {
    ...existing,
    ...metaData,
    updatedAt: new Date().toISOString()
  };
  await fs.promises.writeFile(metaPath, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

// Get story text
async function getStory(slug) {
  const storyPath = path.join(getProjectDir(slug), 'story.md');
  return fs.promises.readFile(storyPath, 'utf8');
}

// Update story text
async function updateStory(slug, text) {
  const projectDir = getProjectDir(slug);
  const storyPath = path.join(projectDir, 'story.md');
  await fs.promises.writeFile(storyPath, text, 'utf8');
  
  // Calculate word count
  const words = text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  await updateProjectMeta(slug, { wordCount: words });
  
  return { success: true, wordCount: words };
}

// Delete project
async function deleteProject(slug) {
  const projectDir = getProjectDir(slug);
  if (fs.existsSync(projectDir)) {
    // recursively remove folder
    await fs.promises.rm(projectDir, { recursive: true, force: true });
    
    // remove from recent projects config
    const config = getConfig();
    let recents = config.recentProjects || [];
    recents = recents.filter(s => s !== slug);
    updateConfig({ recentProjects: recents });
    
    return { success: true };
  }
  throw new Error(`Project directory for slug ${slug} not found`);
}

module.exports = {
  getConfig,
  updateConfig,
  getProjectsRoot,
  listProjects,
  createProject,
  getProjectMeta,
  updateProjectMeta,
  getStory,
  updateStory,
  deleteProject
};
