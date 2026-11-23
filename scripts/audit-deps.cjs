const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('admin')) {
        results = results.concat(walk(file));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
files.push('index.ts');

const directSourceImports = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach(l => {
    const match = l.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const p = match[1];
      if (!p.startsWith('.') && !p.startsWith('@/')) {
        const parts = p.split('/');
        const root = p.startsWith('@') ? parts[0] + '/' + parts[1] : parts[0];
        directSourceImports.add(root);
      }
    }
  });
});

console.log('--- DIRECT RUNTIME IMPORTS IN SRC ---');
console.log('Count:', directSourceImports.size);
console.log([...directSourceImports].sort());

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const pkgDeps = Object.keys(packageJson.dependencies || {});

console.log('\n--- PACKAGE.JSON DEPENDENCIES ---');
console.log('Count:', pkgDeps.length);

const unusedInSource = pkgDeps.filter(d => !directSourceImports.has(d));
console.log('\n--- DEPS NOT DIRECTLY IMPORTED IN SRC (Config plugins, fonts, runtime polyfills) ---');
console.log(unusedInSource);
