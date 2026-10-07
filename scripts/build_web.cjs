// Publish only the allowed public assets, never the repository or local data.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
const allowed = ['index.html', 'dictionary.js', 'storage.js', 'epub.js', 'app.js', 'styles.css'];
for (const name of allowed) {
  let content = fs.readFileSync(path.join(root, 'web', name), 'utf8');
  if (name === 'index.html') content = content.replace('<html lang="es">', '<html lang="es" data-runtime="demo" data-translation="server">');
  fs.writeFileSync(path.join(output, name), content);
}
const files = fs.readdirSync(output).sort();
if (JSON.stringify(files) !== JSON.stringify([...allowed].sort())) {
  throw Error('Unexpected files in dist: refuse to publish.');
}
console.log('Static demo built: ' + allowed.join(', '));
