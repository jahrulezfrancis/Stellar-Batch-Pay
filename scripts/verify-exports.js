import fs from 'node:fs';
import path from 'node:path';

const pkgPath = path.resolve(process.cwd(), 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('Error: package.json not found at', pkgPath);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
let failed = false;

function checkPath(field, p) {
  // If the path contains wildcard (like ./lib/*), resolve the base dir
  let target = p;
  if (p.includes('*')) {
    target = p.split('*')[0];
  }
  const fullPath = path.resolve(process.cwd(), target);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Path defined in package.json "${field}" pointing to "${p}" (${fullPath}) does not exist.`);
    failed = true;
  } else {
    console.log(`Verified "${field}": "${p}" exists.`);
  }
}

// 1. Check main
if (pkg.main) {
  checkPath('main', pkg.main);
} else {
  console.error('Error: package.json is missing the "main" field.');
  failed = true;
}

// 2. Check bin
if (pkg.bin) {
  const bins = typeof pkg.bin === 'string' ? [pkg.bin] : Object.values(pkg.bin);
  bins.forEach((b) => checkPath('bin', b));
}

// 3. Check exports
if (pkg.exports) {
  const checkExports = (obj, keyPath) => {
    if (typeof obj === 'string') {
      checkPath(keyPath, obj);
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [k, v] of Object.entries(obj)) {
        checkExports(v, `${keyPath}.${k}`);
      }
    }
  };
  checkExports(pkg.exports, 'exports');
}

if (failed) {
  process.exit(1);
}

console.log('All entry points are verified and exist.');
