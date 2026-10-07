const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.READLINGO_BASE_URL||'http://127.0.0.1:8766';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.READLINGO_BROWSER_CHANNEL||undefined});
 try {
  const page=await browser.newPage();const errors=[];const api=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))api.push(r.url());});
  await page.goto(base);await page.evaluate(()=>appReady);
  await page.locator('#file-input').setInputFiles({name:'Diccionario.txt',mimeType:'text/plain',buffer:Buffer.from('The prince saw a rose. He drew a sheep and couldn\u2019t sleep. Zqxvunknown constructor.')});
  await page.waitForFunction(()=>document.getElementById('book-title').textContent==='Diccionario');
  for(const [word,meaning] of [['prince',/pr.ncipe/i],['rose',/rosa/i],['saw',/vio|ver/i],['drew',/dibuj|draw/i],['sheep',/oveja/i],['couldn\u2019t',/no pod/i]]) {
   await page.getByRole('button',{name:`Consultar ${word}`,exact:true}).click();
   assert.match(await page.locator('#word-meaning').innerText(),meaning,word);
   assert.match(await page.locator('#word-source').innerText(),/Diccionario local/);
   assert.equal(await page.locator('#word-ipa').innerText(),'');
  }
  await page.getByRole('button',{name:'Consultar prince',exact:true}).click();
  await page.locator('#word-save').click();await page.evaluate(()=>ReadLingoStore.read());
  await page.reload();await page.evaluate(()=>appReady);
  await page.getByRole('button',{name:'Consultar prince',exact:true}).click();
  assert.match(await page.locator('#word-save').innerText(),/Guardada/);
  assert.match(await page.locator('#word-meaning').innerText(),/pr.ncipe/i);
  await page.locator('#nav-review').click();await page.getByRole('button',{name:'Mostrar significado',exact:true}).click();
  assert.match(await page.locator('#review-card').innerText(),/pr.ncipe/i);
  await page.locator('#nav-reader').click();
  for(const word of ['Zqxvunknown','constructor']){
   await page.getByRole('button',{name:`Consultar ${word}`,exact:true}).click();
   assert.match(await page.locator('#word-meaning').innerText(),/todav.a no est/);
   assert.equal(await page.locator('#word-source').innerText(),'Sin significado disponible');
  }
  await page.evaluate(async()=>{state.vocab.prince.meaning='Significado pendiente de consultar';state.vocab.prince.source='Sin significado disponible';await save();});
  await page.reload();await page.evaluate(()=>appReady);
  await page.getByRole('button',{name:'Consultar prince',exact:true}).click();
  assert.match(await page.locator('#word-meaning').innerText(),/pr.ncipe/i);
  assert.match(await page.locator('#word-source').innerText(),/Diccionario local/);
  await page.locator('#word-save').click();
  assert.match((await page.evaluate(()=>ReadLingoStore.read())).vocab.prince.meaning,/pr.ncipe/i);
  await page.evaluate(async()=>{state.vocab.prince.meaning='Mi significado conservado';state.vocab.prince.source='Mi fuente';await save();});
  await page.reload();await page.evaluate(()=>appReady);
  await page.getByRole('button',{name:'Consultar prince',exact:true}).click();
  assert.equal(await page.locator('#word-meaning').innerText(),'Mi significado conservado');
  assert.equal(await page.locator('#word-source').innerText(),'Mi fuente');
  assert.deepEqual(api,[]);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({channel:process.env.READLINGO_BROWSER_CHANNEL||'chromium',version:browser.version(),cases:12,apiRequests:0,pageErrors:0}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
