import {readdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
async function list(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())result.push(...await list(path));else if(entry.name!=='sw.js')result.push(path)}return result.sort()}
const files=await list('dist'), hash=createHash('sha256')
for(const f of files)hash.update(f).update(await readFile(f))
const urls=files.map(f=>'./'+f.slice(5)), name='casefile-'+hash.digest('hex').slice(0,16)
await writeFile('dist/sw.js',`
const cacheName=${JSON.stringify(name)}, files=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('casefile-')&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
event.respondWith(caches.open(cacheName).then(async cache=>(await cache.match(event.request))||(event.request.mode==='navigate'?await cache.match('./index.html'):null)||fetch(event.request)))});
`)
console.log('Offline assets:',files.length,name)
