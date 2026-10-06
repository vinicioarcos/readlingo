'use strict';
// Real-browser storage verification. Uses original synthetic text only; no book upload.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const baseURL=process.env.READLINGO_BASE_URL || 'http://127.0.0.1:8766';
const channel=process.env.READLINGO_BROWSER_CHANNEL || undefined;
const empty=()=>({version:1,books:[],currentBook:'garden',positions:{},vocab:{}});
const original=()=>({version:1,books:[{id:'user-migration',title:'Synthetic migration',text:'A morning.\n\nA garden.'}],currentBook:'user-migration',positions:{'user-migration':1},vocab:{morning:{meaning:'mañana',source:'Glosario local curado',ipa:'',status:'learning',due:123456789,interval:8}}});
const word=meaning=>({meaning,source:'Synthetic test',ipa:'',status:'learning',due:0,interval:0});
(async()=>{
 const browser=await chromium.launch({headless:true,channel});
 const errors=[],flows=[];
 async function newContext(raw){
  const context=await browser.newContext();
  if(raw!==undefined) await context.addInitScript(({value,origin})=>{
   if(location.origin!==origin)return;
   if(!sessionStorage.getItem('storage-test-seeded')){
    localStorage.setItem('readlingo.v1',value);
    sessionStorage.setItem('storage-test-seeded','yes');
   }
  },{value:raw,origin:new URL(baseURL).origin});
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  return context;
 }
 async function open(context){
  const page=await context.newPage();await page.goto(baseURL);
  await page.waitForFunction(()=>typeof ReadLingoStore!=='undefined');
  await page.evaluate(()=>appReady);
  await page.locator('.word').first().waitFor();
  return page;
 }
 const read=page=>page.evaluate(async()=>await ReadLingoStore.read());
 const migrationContext=await newContext(JSON.stringify(original()));
 let page=await open(migrationContext);
 assert.deepEqual(await read(page),await page.evaluate(()=>validateBackup(JSON.parse(localStorage.getItem('readlingo.v1')))));
 assert.equal(await page.locator('#book-title').innerText(),'Synthetic migration');
 assert.match(await page.locator('#paragraph-label').innerText(),/2 DE 2/);
 const migrated=await read(page);
 await page.reload();await page.locator('.word').first().waitFor();
 assert.deepEqual(await read(page),migrated);
 await page.close();page=await open(migrationContext);
 assert.deepEqual(await read(page),migrated);
 flows.push('legacy migration, reload, and new page preserve books position meaning source schedule');
 await migrationContext.close();

 const freshContext=await newContext();
 const freshA=await open(freshContext),freshB=await open(freshContext);
 const first=empty(),second=empty();
 first.books.push({id:'user-first',title:'First import',text:'An original first reading.'});
 second.books.push({id:'user-second',title:'Second import',text:'An original second reading.'});
 await freshA.evaluate(async value=>ReadLingoStore.save(value),first);
 await freshB.evaluate(async value=>ReadLingoStore.save(value),second);
 assert.deepEqual((await read(freshA)).books.map(book=>book.id).sort(),['user-first','user-second']);
 flows.push('two fresh tabs preserve both first imports without seeded storage');
 await freshContext.close();

 const context=await newContext();page=await open(context);
 const large=empty();
 for(let index=0;index<15;index++)large.books.push({id:`user-large-${index}`,title:`Synthetic volume ${index}`,text:'An original storage test sentence. '.repeat(14000)});
 large.currentBook=large.books[0].id;
 assert.ok(JSON.stringify(large).length>5*1024*1024);
 await page.evaluate(async value=>ReadLingoStore.replace(validateBackup(value)),large);
 assert.deepEqual((await read(page)).books,await page.evaluate(value=>validateBackup(value).books,large));
 await page.reload();await page.locator('.word').first().waitFor();
 assert.equal((await read(page)).books.length,15);
 assert.equal(await page.locator('#book-title').innerText(),'Synthetic volume 0');
 flows.push('library larger than 5 MiB persists in IndexedDB across reload');

 // Start both tabs with the same snapshot. Deliberately save the stale second snapshot.
 await page.evaluate(async value=>ReadLingoStore.replace(value),empty());
 await page.reload();await page.locator('.word').first().waitFor();
 const tab2=await open(context);
 await page.evaluate(()=>{window.staleTest=structuredClone(state)});
 await tab2.evaluate(()=>{window.staleTest=structuredClone(state)});
 await page.evaluate(async value=>{
  const candidate=structuredClone(staleTest);
  candidate.books.push({id:'user-tab-one',title:'Tab one',text:'An original morning.'});
  candidate.vocab.morning=value;candidate.positions.garden=1;
  await ReadLingoStore.save(candidate);
 },word('one'));
 await tab2.evaluate(async value=>{
  const candidate=structuredClone(staleTest);
  candidate.books.push({id:'user-tab-two',title:'Tab two',text:'An original garden.'});
  candidate.vocab.garden=value;candidate.positions.coast=1;
  await ReadLingoStore.save(candidate);
 },word('two'));
 const merged=await read(page);
 assert.deepEqual(merged.books.map(book=>book.id).sort(),['user-tab-one','user-tab-two']);
 assert.equal(merged.vocab.morning.meaning,'one');assert.equal(merged.vocab.garden.meaning,'two');
 assert.equal(merged.positions.garden,1);assert.equal(merged.positions.coast,1);
 await Promise.all([page.reload(),tab2.reload()]);
 await Promise.all([page.locator('.word').first().waitFor(),tab2.locator('.word').first().waitFor()]);
 assert.deepEqual(await read(page),merged);assert.deepEqual(await read(tab2),merged);
 flows.push('stale tabs merge distinct books vocabulary and positions');

 const replacement=original();
 await page.evaluate(async value=>restoreProgress(JSON.stringify(value)),replacement);
 const replaced=await read(page);
 assert.equal(replaced.books.length,1);assert.equal(replaced.books[0].id,'user-migration');
 assert.deepEqual(Object.keys(replaced.vocab),['morning']);
 const sessionBeforeFailure=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));
 const transactionFailure=await page.evaluate(async value=>{
  const realPut=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(){throw new DOMException('Synthetic quota failure','QuotaExceededError')};
  try{await restoreProgress(JSON.stringify(value));return false}
  catch(error){return error.name==='QuotaExceededError'}
  finally{IDBObjectStore.prototype.put=realPut}
 },empty());
 assert.equal(transactionFailure,true);
 assert.deepEqual(await read(page),replaced);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(state))),sessionBeforeFailure);
 flows.push('aborted replacement transaction preserves durable and visible session state');
 await page.evaluate(async value=>ReadLingoStore.replace(value),empty());
 assert.deepEqual(await read(page),empty());
 await page.reload();await page.locator('.word').first().waitFor();
 assert.equal(await page.locator('#book-title').innerText(),'A Garden in the City');
 assert.deepEqual(await read(page),empty());
 flows.push('restore replaces rather than merges and reset remains empty after reload');
 await context.close();

 const broken='{corrupt legacy JSON';
 const corruptContext=await newContext(broken);page=await open(corruptContext);
 assert.equal(await page.evaluate(()=>localStorage.getItem('readlingo.v1')),broken);
 assert.equal(await page.evaluate(()=>ReadLingoStore.recovery()),broken);
 await page.evaluate(async()=>{
  try{await ReadLingoStore.save({version:1,books:[],currentBook:'garden',positions:{garden:1},vocab:{}})}catch(error){}
 });
 assert.equal(await page.evaluate(()=>localStorage.getItem('readlingo.v1')),broken);
 assert.equal(await read(page),null);
 flows.push('corrupt migration is retained and normal writes are blocked');
 await corruptContext.close();

 // A dedicated synthetic profile also verifies durability after the browser closes.
 fs.mkdirSync('artifacts',{recursive:true});
 const profile=path.resolve('artifacts',`storage-profile-${process.pid}-${Date.now()}`);
 let persistedContext=await chromium.launchPersistentContext(profile,{headless:true,channel});
 page=await open(persistedContext);
 await page.evaluate(async value=>ReadLingoStore.replace(validateBackup(value)),original());
 const beforeClose=await read(page);
 await persistedContext.close();
 persistedContext=await chromium.launchPersistentContext(profile,{headless:true,channel});
 page=await open(persistedContext);
 assert.deepEqual(await read(page),beforeClose);
 assert.equal(await page.locator('#book-title').innerText(),'Synthetic migration');
 await persistedContext.close();
 flows.push('browser profile closure and restart preserve imported text and progress');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',baseURL,browserVersion:browser.version(),flows,errors}));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
