const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const frontendRoot = path.join(repoRoot, 'frontend');
const frontendDist = path.join(frontendRoot, 'dist');
const backendPublic = path.join(backendRoot, 'public');

if (!fs.existsSync(path.join(frontendRoot, 'package.json'))) {
  console.log('Frontend directory not found. Skipping frontend build.');
  process.exit(0);
}

function runNpm(args, options) {
  if (process.platform === 'win32') {
    return execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'npm.cmd', ...args], options);
  }
  return execFileSync('npm', args, options);
}

if (fs.existsSync(path.join(frontendRoot, 'node_modules'))) {
  console.log('Frontend dependencies already installed. Skipping install.');
} else {
  console.log('Installing frontend dependencies...');
  runNpm(['install'], { cwd: frontendRoot, stdio: 'inherit' });
}

console.log('Building frontend...');
runNpm(['run', 'build'], {
  cwd: frontendRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_URL: process.env.VITE_API_URL || '/api'
  }
});

fs.rmSync(backendPublic, { recursive: true, force: true });
fs.mkdirSync(backendPublic, { recursive: true });
fs.cpSync(frontendDist, backendPublic, { recursive: true });

console.log(`Frontend build copied to ${backendPublic}`);
