'use strict';
// API responses are synthetic contracts; no request reaches Azure.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const baseURL=process.env.READLINGO_BASE_URL||'http://127.0.0.1:8766';
const channel=process.env.READLINGO_BROWSER_CHANNEL||undefined;
const cacheKey='readlingo.translations.v1';
const access='synthetic-personal-code-1234567890123456';
(async()=>{
 const browser=await chromium.launch({headless:true,channel});
 const errors=[],flows=[];
 async function open({enabled=true,raw,quota=false,responseStatus=200,delay=0}={}){
  const context=await browser.newContext();const calls=[];
  await context.addInitScript(({raw,quota,cacheKey})=>{
   if(raw!==undefined&&!sessionStorage.getItem('translation-seeded')){localStorage.setItem(cacheKey,raw);sessionStorage.setItem('translation-seeded','yes');}
   if(quota){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===cacheKey)throw new DOMException('Synthetic quota','QuotaExceededError');return set.call(this,k,v);};}
  },{raw,quota,cacheKey});
  await context.route('**/api/config',route=>route.fulfill({json:{translation:enabled,pronunciation:false,requiresAccess:true,wordOnly:true,provider:'Azure Translator',plan:'F0'}}));
  await context.route('**/api/translate',async route=>{
   calls.push({method:route.request().method(),body:route.request().postDataJSON(),headers:route.request().headers()});
   if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
   await route.fulfill({status:responseStatus,json:responseStatus===200?{translation:'traduccion sintetica',source:'Azure Translator'}:{error:`Synthetic error ${responseStatus}`}});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);await page.evaluate(()=>appReady);
  await page.waitForFunction(()=>config.requiresAccess===true);
  return {context,page,calls};
 }
 async function select(page,word='quizzacious'){await page.evaluate(word=>selectWord(word,document.createElement('button')),word);}
 async function query(page){await page.locator('#word-translate').click();await page.waitForFunction(()=>!document.getElementById('word-translate').disabled);}
 let {context,page,calls}=await open();
 await select(page);assert.equal(calls.length,0);await query(page);assert.equal(calls.length,0);
 assert.match(await page.locator('#status').innerText(),/c.digo personal/);
 await page.locator('#translation-access').fill(access);await query(page);
 assert.equal(calls.length,1);assert.deepEqual(calls[0].body,{text:'quizzacious',consent:true});assert.equal(calls[0].headers.authorization,`Bearer ${access}`);
 assert.equal(calls[0].method,'POST');assert.equal(await page.locator('#word-meaning').innerText(),'traduccion sintetica');
 assert.equal(await page.evaluate(()=>Object.keys(state.vocab).length),0);
 assert.equal(await page.locator('#sentence-translate').isVisible(),false);assert.equal(await page.locator('#assessment-controls').isVisible(),false);
 flows.push('explicit word-only consent and personal access; no query on selection; no sentence/audio service');
 await query(page);assert.equal(calls.length,1);await page.reload();await page.evaluate(()=>appReady);await page.waitForFunction(()=>config.requiresAccess===true);await select(page);
 assert.equal(await page.locator('#word-meaning').innerText(),'traduccion sintetica');await query(page);assert.equal(calls.length,1);
 assert.equal(await page.locator('#translation-access').inputValue(),'');
 await page.locator('#word-save').click();await page.waitForFunction(()=>state.vocab.quizzacious?.source==='Azure Translator');
 assert.equal((await page.evaluate(()=>ReadLingoStore.read())).vocab.quizzacious.meaning,'traduccion sintetica');
 flows.push('cache survives reload and reuse without code or new request; Aprender preserves source');await context.close();
 ({context,page,calls}=await open({enabled:false}));await select(page);assert.equal(await page.locator('#word-translate').isVisible(),false);assert.equal(calls.length,0);flows.push('missing configuration disables online consultation');await context.close();
 ({context,page,calls}=await open({enabled:false,raw:JSON.stringify({quizzacious:{translation:'cache sintetica',source:'Azure Translator'}})}));
 await select(page);await query(page);assert.equal(await page.locator('#word-meaning').innerText(),'cache sintetica');assert.equal(calls.length,0);
 flows.push('cached translations remain reusable while provider is disabled');await context.close();
 for(const responseStatus of [401,429,502]){
  ({context,page,calls}=await open({responseStatus}));await select(page);await page.locator('#translation-access').fill(access);await query(page);
  assert.match(await page.locator('#status').innerText(),new RegExp(String(responseStatus)));assert.equal(await page.evaluate(key=>localStorage.getItem(key),cacheKey),null);
  assert.equal(calls.length,1);await context.close();
 }flows.push('auth quota and provider errors visible and never cached');
 ({context,page,calls}=await open({delay:300}));await select(page);await page.locator('#translation-access').fill(access);await page.locator('#word-translate').click();await select(page,'morning');await page.waitForTimeout(450);
 assert.equal(await page.locator('#selected-word').innerText(),'morning');assert.notEqual(await page.locator('#word-meaning').innerText(),'traduccion sintetica');flows.push('stale response cannot replace newly selected word');await context.close();
 for(const options of [{quota:true},{raw:'{malformed-cache'}]){
  ({context,page,calls}=await open(options));await select(page);await page.locator('#translation-access').fill(access);await query(page);
  assert.match(await page.locator('#translation-status').innerText(),/sesi.n/);await query(page);assert.equal(calls.length,1);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),cacheKey),options.raw||null);await context.close();
 }flows.push('quota and corrupt cache retain raw data and allow session reuse');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:await browser.version(),channel,baseURL,flows},null,2));await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
