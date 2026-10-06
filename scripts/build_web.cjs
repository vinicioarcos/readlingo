// Publish only the three public assets, never the repository or local data.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
for (const name of ['index.html', 'app.js', 'styles.css']) {
  let content = fs.readFileSync(path.join(root, 'web', name), 'utf8');
  if (name === 'index.html') content = content.replace('<html lang="es">', '<html lang="es" data-runtime="demo">');
  fs.writeFileSync(path.join(output, name), content);
}
const files = fs.readdirSync(output).sort();
if (JSON.stringify(files) !== JSON.stringify(['app.js', 'index.html', 'styles.css'])) {
  throw Error('Unexpected files in dist: refuse to publish.');
}
console.log('Static demo built: index.html, app.js, styles.css');
