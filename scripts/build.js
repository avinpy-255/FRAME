const { execSync } = require('child_process');
const path = require('path');

console.log('Building FRAME frontend client...');

try {
  execSync('npm run build --prefix client', { stdio: 'inherit' });
  console.log('Build completed successfully. Production files are in client/dist.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
