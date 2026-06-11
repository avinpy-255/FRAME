const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const frameConfigDir = path.join(homeDir, '.frame');
const frameConfigPath = path.join(frameConfigDir, 'config.json');
const defaultProjectsRoot = path.join(homeDir, 'frame-projects');

console.log('Running FRAME Post-Install Setup...');

// 1. Ensure config directory exists
if (!fs.existsSync(frameConfigDir)) {
  fs.mkdirSync(frameConfigDir, { recursive: true });
  console.log(`Created configuration directory: ${frameConfigDir}`);
}

// 2. Ensure default projects directory exists
if (!fs.existsSync(defaultProjectsRoot)) {
  fs.mkdirSync(defaultProjectsRoot, { recursive: true });
  console.log(`Created default projects directory: ${defaultProjectsRoot}`);
}

// 3. Write default config if not present
if (!fs.existsSync(frameConfigPath)) {
  const defaultConfig = {
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
  fs.writeFileSync(frameConfigPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  console.log(`Created default config at: ${frameConfigPath}`);
} else {
  console.log(`Config file already exists at: ${frameConfigPath}`);
}

console.log('Setup completed successfully.');
