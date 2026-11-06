import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import {createGroupService} from './scripts/group-service.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.argv[2] || 8080);
let groupService;let groupInitialization;
async function groupApi(request,response,pathname){
  response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('Cache-Control','no-store');
  try{
    if(!/^(localhost|127\.0\.0\.1):\d+$/.test(request.headers.host??''))throw Error('Nur lokale Testzugriffe.');
    if(request.headers.origin&&new URL(request.headers.origin).host!==request.headers.host)throw Error('Fremder Ursprung.');
    let body=null;
    if(request.method!=='GET'){
      if(!(request.headers['content-type']??'').startsWith('application/json'))throw Error('JSON erforderlich.');
      const chunks=[];let size=0;for await(const chunk of request){size+=chunk.length;if(size>7000000)throw Error('Datei zu groß.');chunks.push(chunk);}
      body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    if(!groupService){
      groupInitialization??=(async()=>{const [rules,skillRules,cyberwareRules,equipmentRules]=await Promise.all(['rules','skills','cyberware','equipment'].map(async name=>JSON.parse(await readFile(resolve(root,'data',name+'.json'),'utf8'))));
      groupService=createGroupService(resolve(root,'.local','group-'+port+'.json'),{...rules,skillRules,cyberwareRules,equipmentRules});})();
      await groupInitialization;
    }
    const result=await groupService(request.method,pathname,body);
    response.writeHead(result.conflict?409:200).end(JSON.stringify(result));
  }catch(error){response.writeHead(400).end(JSON.stringify({error:error.message}));}
}
const basePath = process.argv[3] || '/';
if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('Der Basispfad muss mit / beginnen und enden.');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.ttf': 'font/ttf' };
createServer(async (request, response) => {
  try {
    const requestedPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!requestedPath.startsWith(basePath)) {
      response.writeHead(404).end('Nicht gefunden');
      return;
    }
    const pathname = `/${requestedPath.slice(basePath.length)}`;
    if(pathname==='/api/group'||pathname.startsWith('/api/group/'))return await groupApi(request,response,pathname.slice('/api/group'.length));
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : `${root}${sep}`) || pathname.split('/').some(part => part.startsWith('.'))) {
      response.writeHead(403).end('Zugriff verweigert');
      return;
    }
    const data = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(data);
  } catch {
    response.writeHead(404).end('Nicht gefunden');
  }
}).listen(port, '127.0.0.1', () => console.log(`RED//BUILDER: http://127.0.0.1:${port}${basePath}`));
