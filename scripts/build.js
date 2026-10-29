import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', {recursive:true});
for (const file of ['index.html','styles.css','app.js','ledger.js','API.md']) await copyFile(file, `dist/${file}`);
console.log('QZPAY built into dist/');
