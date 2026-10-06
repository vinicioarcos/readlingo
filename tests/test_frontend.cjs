/* Logical UI integration with a minimal DOM double. This is NOT a browser or audio test. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'web/index.html'),'utf8');
function harness(saved=null,demo=false){
 class Element {
  constructor(){this.children=[];this.textContent='';this.dataset={};this.value='';this.events={};this.hidden=false;this.className='';this.classList={add:()=>{},remove:()=>{},toggle:()=>{}};}
  append(...items){this.children.push(...items)}
  replaceChildren(...items){this.children=items}
  addEventListener(type,fn){this.events[type]=fn}
  setAttribute(k,v){this[k]=v}
  removeAttribute(k){delete this[k]}
  pause(){}
  click(){this.events.click?.()}
 }
 const ids=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 let persisted=saved;
 const context=vm.createContext({
  document:{documentElement:{dataset:{runtime:demo?'demo':'local'}},getElementById:id=>{assert.ok(ids[id],`Missing HTML id: ${id}`);return ids[id]},createElement:()=>new Element(),createTextNode:text=>({textContent:text}),querySelectorAll:()=>[],addEventListener:()=>{}},
  window:{addEventListener:()=>{}},
  localStorage:{getItem:()=>persisted,setItem:(k,v)=>{persisted=v}},
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
  fetch:async()=>({ok:true,json:async()=>({translation:false,pronunciation:false})}),
  AbortController,URL,Blob,TextDecoder,console,confirm:()=>true,
  btoa:s=>Buffer.from(s,'binary').toString('base64')
 });
 vm.runInContext(code,context);
 return {context,ids,run:expr=>vm.runInContext(expr,context),data:()=>persisted};
}
test('startup, dictionary, vocabulary, and scheduled review',()=>{
 const h=harness();
 assert.equal(h.ids['book-title'].textContent,'A Garden in the City');
 h.run("selectWord('morning');storeWord('learning');showView('review')");
 assert.match(h.ids['word-meaning'].textContent,/mañana/);
 assert.equal(h.run('dueWords().length'),1);
 function walk(e){return [e,...(e.children||[]).flatMap(walk)]}
 const recall=walk(h.ids['review-card']).find(e=>e.textContent?.startsWith('Lo recordé'));
 assert.ok(recall);recall.click();
 assert.equal(h.run('dueWords().length'),0);
 assert.equal(h.run('state.vocab.morning.interval'),1);
 assert.ok(JSON.parse(h.data()).vocab.morning);
});
test('large reading is bounded without losing non-whitespace content',()=>{
 const h=harness();
 h.run("addBook('Large', 'A long sentence about learning. '.repeat(15000))");
 assert.ok(h.run('paragraphs().length')>200);
 assert.ok(h.run('paragraphs().every(p=>p.length<=1800)'));
 assert.ok(h.run("paragraphs().join('').replace(/\\s/g,'')===currentBook().text.replace(/\\s/g,'')"));
 assert.ok(h.run('sentences.every(s=>s.length<=800)'));
});
test('quota error stays visible after import and vocabulary save',()=>{
 const h=harness();
 h.run("localStorage.setItem=()=>{throw Error('QuotaExceededError')};addBook('Temporary','A short reading.')");
 assert.match(h.ids.status.textContent,/solo están en esta sesión/);
 h.run("selectWord('morning');storeWord('learning')");
 assert.match(h.ids.status.textContent,/solo están en esta sesión/);
});
test('reload restores reader position and rejects corrupt vocabulary keys',()=>{
 const h=harness();h.run('navigate(1)');
 const restored=harness(h.data());
 assert.equal(restored.run('position()'),1);
 const bad=JSON.stringify({version:1,books:[],currentBook:'missing',positions:{garden:999999},vocab:{constructor:{meaning:'x',status:'learning',due:0,interval:0},good:{meaning:'bien',status:'learning',due:0,interval:0}}});
 const safe=harness(bad);
 assert.equal(safe.run('position()'),2);
 assert.equal(safe.run("Object.hasOwn(state.vocab,'constructor')"),false);
 assert.equal(safe.run('state.vocab.good.meaning'),'bien');
});
test('consent toggle cannot enable duplicate in-flight assessment',()=>{
 const h=harness();
 h.run("assessmentBusy=true;recordBlob=new Blob(['audio']);$('audio-consent').checked=true");
 h.ids['audio-consent'].events.change();
 assert.equal(h.ids.assess.disabled,true);
});

test('translated meaning and source survive save selection and reload',async()=>{
 const h=harness(); await new Promise(resolve=>setImmediate(resolve));
 h.context.fetch=async()=>({ok:true,json:async()=>({translation:'amanecer traducido',source:'Azure Translator'})});
 h.run("config.translation=true;selectWord('morning')");
 await h.run('translate()'); h.run("storeWord('learning');selectWord('garden');selectWord('morning')");
 assert.equal(h.ids['word-meaning'].textContent,'amanecer traducido');
 assert.equal(h.ids['word-source'].textContent,'Azure Translator');
 const reload=harness(h.data());reload.run("selectWord('morning');showView('vocab');showView('review')");
 assert.equal(reload.ids['word-meaning'].textContent,'amanecer traducido');
 assert.equal(reload.ids['word-source'].textContent,'Azure Translator');
 assert.equal(reload.run('state.vocab.morning.source'),'Azure Translator');
});
test('backup roundtrip preserves books position vocabulary and schedule',()=>{
 const h=harness();h.run("addBook('My book','First paragraph.\\n\\nSecond paragraph.');navigate(1);selectWord('morning');storeWord('learning');state.vocab.morning.interval=8;state.vocab.morning.due=123456789;save()");
 const backup=h.data();const restored=harness();restored.context.backup=backup;restored.run('restoreProgress(backup)');
 assert.deepEqual(JSON.parse(restored.data()),JSON.parse(backup));
 assert.equal(restored.run('position()'),1);
});
test('invalid or unpersistable backup leaves current data intact',()=>{
 const h=harness();h.run("selectWord('morning');storeWord('learning')");const before=h.data();
 for(const bad of ['{',JSON.stringify({...JSON.parse(before),version:2}),JSON.stringify({...JSON.parse(before),books:[{id:'user-x',title:'x',text:'x'},{id:'user-x',title:'x',text:'x'}]}),JSON.stringify({...JSON.parse(before),vocab:{constructor:{meaning:'x',status:'learning',due:0,interval:0}}})]){
 h.context.bad=bad;assert.throws(()=>h.run('restoreProgress(bad)'));assert.equal(h.data(),before);assert.equal(h.run('state.vocab.morning.meaning'),JSON.parse(before).vocab.morning.meaning);
 }
 h.context.backup=before;h.run("localStorage.setItem=()=>{throw Error('QuotaExceededError')}");assert.throws(()=>h.run('restoreProgress(backup)'));assert.equal(h.data(),before);
});

test('demo imports UTF8 TXT without API and rejects unsafe or unsupported files',async()=>{
 const h=harness(null,true);let calls=0;h.context.fetch=()=>{calls++;throw Error('Unexpected API')};
 const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>new Uint8Array(bytes).buffer});
 h.context.file=file('Reading.txt',Buffer.from('A morning. <script>window.injected=true</script>'));
 await h.run('importReading(file)');assert.equal(calls,0);assert.equal(h.run('state.books.length'),1);
 assert.match(h.run('currentBook().text'),/<script>/);assert.equal(h.context.window.injected,undefined);
 const intact=h.data();
 for(const bad of [file('book.epub',[1]),file('bad.txt',[0xff]),file('nul.txt',[65,0,66]),{name:'huge.txt',size:11*1024*1024}]){
 h.context.file=bad;await assert.rejects(h.run('importReading(file)'));assert.equal(h.data(),intact);
 }
 assert.equal(calls,0);assert.equal(h.ids['demo-notice'].hidden,false);assert.equal(h.ids['file-input'].accept,'.txt');
 assert.equal(h.ids['assessment-controls'].hidden,true);
});
