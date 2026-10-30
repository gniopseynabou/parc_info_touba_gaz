const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(full);
    } else if (entry.name.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('export const dynamic')) {
        content = content.replace(/export const dynamic = "force-dynamic";\r?\n?/g, '');
        fs.writeFileSync(full, content, 'utf8');
        console.log('Cleaned:', full);
      }
    }
  }
}
processDir('./src/app/api');
