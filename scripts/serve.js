import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/ledger.js':'ledger.js','/API.md':'API.md'};
http.createServer(async(req,res)=>{const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);return res.end();}try{const data=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.md')?'text/plain; charset=utf-8':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(500);res.end();}}).listen(4173,'127.0.0.1',()=>console.log('http://localhost:4173'));
