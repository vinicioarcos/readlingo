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
  click(){return this.events.click?.()}
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
 context.ReadLingoStore={
  load:async validate=>({state:persisted?validate(JSON.parse(persisted)):null,backend:'indexedDB'}),
  save:async state=>{context.localStorage.setItem('readlingo.v1',JSON.stringify(state));return {state}},
  replace:async state=>{context.localStorage.setItem('readlingo.v1',JSON.stringify(state));return {state}},
  recovery:async()=>persisted,protect:async()=>false
 };
 vm.runInContext(fs.readFileSync(path.join(root,'web/dictionary.js'),'utf8'),context);
 vm.runInContext(code,context);
 return {context,ids,run:expr=>vm.runInContext(expr,context),ready:()=>vm.runInContext("appReady",context),data:()=>persisted};
}
test('startup, dictionary, vocabulary, and scheduled review',async()=>{
 const h=harness();await h.ready();
 assert.equal(h.ids['book-title'].textContent,'A Garden in the City');
 await h.run("(async()=>{selectWord('morning');await storeWord('learning');showView('review')})()");
 assert.match(h.ids['word-meaning'].textContent,/mañana/);
 assert.equal(h.run('dueWords().length'),1);
 function walk(e){return [e,...(e.children||[]).flatMap(walk)]}
 const recall=walk(h.ids['review-card']).find(e=>e.textContent?.startsWith('Lo recordé'));
 assert.ok(recall);await recall.click();
 assert.equal(h.run('dueWords().length'),0);
 assert.equal(h.run('state.vocab.morning.interval'),1);
 assert.ok(JSON.parse(h.data()).vocab.morning);
});
test('large reading is bounded without losing non-whitespace content',async()=>{
 const h=harness();await h.ready();
 await h.run("(async()=>{await addBook('Large', 'A long sentence about learning. '.repeat(15000))})()");
 assert.ok(h.run('paragraphs().length')>200);
 assert.ok(h.run('paragraphs().every(p=>p.length<=1800)'));
 assert.ok(await h.run("(async()=>{return paragraphs().join('').replace(/\\s/g,'')===currentBook().text.replace(/\\s/g,'')})()"));
 assert.ok(h.run('sentences.every(s=>s.length<=800)'));
});
test('quota error stays visible after import and vocabulary save',async()=>{
 const h=harness();await h.ready();
 await h.run("(async()=>{localStorage.setItem=()=>{throw Error('QuotaExceededError')};await addBook('Temporary','A short reading.')})()");
 assert.match(h.ids.status.textContent,/solo están en esta sesión/);
 await h.run("(async()=>{selectWord('morning');await storeWord('learning')})()");
 assert.match(h.ids.status.textContent,/solo están en esta sesión/);
});
test('reload restores reader position and rejects corrupt vocabulary keys',async()=>{
 const h=harness();await h.ready();await h.run('navigate(1)');
 const restored=harness(h.data());await restored.ready();
 assert.equal(restored.run('position()'),1);
 const bad=JSON.stringify({version:1,books:[],currentBook:'missing',positions:{garden:999999},vocab:{constructor:{meaning:'x',status:'learning',due:0,interval:0},good:{meaning:'bien',status:'learning',due:0,interval:0}}});
 const safe=harness(bad);await safe.ready();
 assert.equal(safe.run('position()'),0);assert.equal(safe.data(),bad);
 assert.equal(safe.run("Object.hasOwn(state.vocab,'constructor')"),false);
 assert.equal(safe.run('state.vocab.good'),undefined);
});
test('consent toggle cannot enable duplicate in-flight assessment',async()=>{
 const h=harness();await h.ready();
 await h.run("(async()=>{assessmentBusy=true;recordBlob=new Blob(['audio']);$('audio-consent').checked=true})()");
 h.ids['audio-consent'].events.change();
 assert.equal(h.ids.assess.disabled,true);
});

test('translated meaning and source survive save selection and reload',async()=>{
 const h=harness();await h.ready(); await new Promise(resolve=>setImmediate(resolve));
 h.context.fetch=async()=>({ok:true,json:async()=>({translation:'amanecer traducido',source:'Azure Translator'})});
 await h.run("(async()=>{config.translation=true;selectWord('morning')})()");
 await h.run('translate()'); await h.run("(async()=>{await storeWord('learning');selectWord('garden');selectWord('morning')})()");
 assert.equal(h.ids['word-meaning'].textContent,'amanecer traducido');
 assert.equal(h.ids['word-source'].textContent,'Azure Translator');
 const reload=harness(h.data());await reload.ready();reload.run("selectWord('morning');showView('vocab');showView('review')");
 assert.equal(reload.ids['word-meaning'].textContent,'amanecer traducido');
 assert.equal(reload.ids['word-source'].textContent,'Azure Translator');
 assert.equal(reload.run('state.vocab.morning.source'),'Azure Translator');
});
test('backup roundtrip preserves books position vocabulary and schedule',async()=>{
 const h=harness();await h.ready();await h.run("(async()=>{await addBook('My book','First paragraph.\\n\\nSecond paragraph.');await navigate(1);selectWord('morning');await storeWord('learning');state.vocab.morning.interval=8;state.vocab.morning.due=123456789;await save()})()");
 const backup=h.data();const restored=harness();await restored.ready();restored.context.backup=backup;await restored.run('restoreProgress(backup)');
 assert.deepEqual(JSON.parse(restored.data()),JSON.parse(backup));
 assert.equal(restored.run('position()'),1);
});
test('invalid or unpersistable backup leaves current data intact',async()=>{
 const h=harness();await h.ready();await h.run("(async()=>{selectWord('morning');await storeWord('learning')})()");const before=h.data();
 for(const bad of ['{',JSON.stringify({...JSON.parse(before),version:2}),JSON.stringify({...JSON.parse(before),books:[{id:'user-x',title:'x',text:'x'},{id:'user-x',title:'x',text:'x'}]}),JSON.stringify({...JSON.parse(before),vocab:{constructor:{meaning:'x',status:'learning',due:0,interval:0}}})]){
 h.context.bad=bad;await assert.rejects(h.run('restoreProgress(bad)'));assert.equal(h.data(),before);assert.equal(h.run('state.vocab.morning.meaning'),JSON.parse(before).vocab.morning.meaning);
 }
 h.context.backup=before;await h.run("(async()=>{localStorage.setItem=()=>{throw Error('QuotaExceededError')}})()");await assert.rejects(h.run('restoreProgress(backup)'));assert.equal(h.data(),before);
});

test('demo imports UTF8 TXT without API and rejects unsafe or unsupported files',async()=>{
 const h=harness(null,true);await h.ready();let calls=0;h.context.fetch=()=>{calls++;throw Error('Unexpected API')};
 const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>new Uint8Array(bytes).buffer});
 h.context.file=file('Reading.txt',Buffer.from('A morning. <script>window.injected=true</script>'));
 await h.run('importReading(file)');assert.equal(calls,0);assert.equal(h.run('state.books.length'),1);
 assert.match(h.run('currentBook().text'),/<script>/);assert.equal(h.context.window.injected,undefined);
 const intact=h.data();
 for(const bad of [file('book.epub',[1]),file('bad.txt',[0xff]),file('nul.txt',[65,0,66]),{name:'huge.txt',size:11*1024*1024}]){
 h.context.file=bad;await assert.rejects(h.run('importReading(file)'));assert.equal(h.data(),intact);
 }
 assert.equal(calls,0);assert.equal(h.ids['demo-notice'].hidden,false);assert.equal(h.ids['file-input'].accept,'.txt,.epub');
 assert.equal(h.ids['assessment-controls'].hidden,true);
});

test('EPUB client integration preserves original text and makes no upload',async()=>{
 const h=harness(null,true);await h.ready();let calls=0;h.context.fetch=()=>{calls++;throw Error('Unexpected upload')};
 h.context.ReadLingoEpub={extract:async()=>({title:'Original English Book',text:'A morning in the garden.',language:'en-US'})};
 h.context.file={name:'book.epub',size:10,arrayBuffer:async()=>new ArrayBuffer(10)};
 await h.run('importReading(file)');assert.equal(h.run('currentBook().title'),'Original English Book');
 assert.equal(h.run('currentBook().text'),'A morning in the garden.');assert.equal(calls,0);
 h.context.ReadLingoEpub.extract=async()=>({title:'Spanish book',text:'Un texto original.',language:'es'});
 await h.run('importReading(file)');assert.match(h.ids.status.textContent,/no lo traduce/);
 const intact=h.data();h.context.ReadLingoEpub.extract=async()=>{throw Error('EPUB corrupto')};
 await assert.rejects(h.run('importReading(file)'));assert.equal(h.data(),intact);assert.equal(calls,0);
});

test('expanded local meanings select save and reload without API calls',async()=>{
 const h=harness(null,true);await h.ready();let calls=0;
 h.context.fetch=()=>{calls++;throw Error('Unexpected translation request')};
 await h.run("addBook('English fiction','The prince drew a sheep. He saw a fox and a rose. He couldn\u2019t leave.')");
 h.run("selectWord('prince')");assert.match(h.ids['word-meaning'].textContent,/pr\u00edncipe/);
 assert.match(h.ids['word-source'].textContent,/Diccionario local/);
 await h.run("storeWord('learning')");
 const restored=harness(h.data(),true);await restored.ready();restored.run("selectWord('prince')");
 assert.match(restored.ids['word-meaning'].textContent,/pr\u00edncipe/);
 assert.match(restored.ids['word-source'].textContent,/Diccionario local/);
 h.run("selectWord('constructor')");assert.match(h.ids['word-meaning'].textContent,/glosario local/);
 h.run("selectWord('qzxunknown')");assert.equal(h.ids['word-ipa'].textContent,'');
 assert.match(h.ids['word-source'].textContent,/Sin significado/);assert.equal(calls,0);
});

test('new glossary fills a previously pending saved meaning',async()=>{
 const h=harness(null,true);await h.ready();
 h.run("state.vocab.fox={meaning:'Significado pendiente de consultar',source:'Sin significado disponible',ipa:'',status:'learning',due:0,interval:0};selectWord('fox')");
 assert.match(h.ids['word-meaning'].textContent,/zorro/);
 assert.match(h.ids['word-source'].textContent,/Diccionario local/);
 await h.run("storeWord('learning')");assert.match(JSON.parse(h.data()).vocab.fox.meaning,/zorro/);
});
