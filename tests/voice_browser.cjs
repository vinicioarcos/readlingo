'use strict';
// Contract tests use synthetic voices and produce no audio.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const baseURL=process.env.READLINGO_BASE_URL || 'http://127.0.0.1:8766';
const channel=process.env.READLINGO_BROWSER_CHANNEL || undefined;
const key='readlingo.voice.v1';
const alice={voiceURI:'synthetic-alice',name:'Synthetic Alice',lang:'en-US'};
const bob={voiceURI:'synthetic-bob',name:'Synthetic Bob',lang:'en-GB'};
(async()=>{
 const browser=await chromium.launch({headless:true,channel});
 const errors=[],flows=[];
 async function open({voices=[alice,bob],raw,quota=false}={}){
  const context=await browser.newContext();
  await context.addInitScript(({voices,raw,quota,key})=>{
   if(raw!==undefined&&!sessionStorage.getItem('voice-seeded')){
    localStorage.setItem(key,raw);sessionStorage.setItem('voice-seeded','yes');
   }
   const events=new EventTarget();
   window.__voices=voices;window.__spoken=[];
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
    getVoices:()=>window.__voices,
    addEventListener:(...args)=>events.addEventListener(...args),
    cancel:()=>{},speak:utterance=>window.__spoken.push({text:utterance.text,uri:utterance.voice?.voiceURI,lang:utterance.lang})
   }});
   window.__setVoices=next=>{window.__voices=next;events.dispatchEvent(new Event('voiceschanged'));};
   window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
   if(quota){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Synthetic quota','QuotaExceededError');return set.call(this,k,v);};}
  },{voices,raw,quota,key});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(baseURL);await page.evaluate(()=>appReady);
  return {context,page};
 }
 let {context,page}=await open();
 await page.locator('#voice').selectOption(bob.voiceURI);
 assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),{uri:bob.voiceURI,name:bob.name,lang:bob.lang});
 await page.reload();await page.evaluate(()=>appReady);
 assert.equal(await page.locator('#voice').inputValue(),bob.voiceURI);
 await page.locator('#listen').click();
 assert.equal((await page.evaluate(()=>window.__spoken))[0].uri,bob.voiceURI);
 flows.push('selection persists after reload and preferred voice is used for speech');
 await page.evaluate(()=>window.__setVoices([]));
 assert.equal(await page.locator('#voice').inputValue(),'');
 assert.match(await page.locator('#voice-preference').innerText(),/no est.*disponible/);
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).uri,key),bob.voiceURI);
 await page.evaluate(voices=>window.__setVoices(voices),[alice,bob]);
 assert.equal(await page.locator('#voice').inputValue(),bob.voiceURI);
 flows.push('unavailable voice falls back and restores when available');
 await page.locator('#voice').selectOption('');await page.reload();await page.evaluate(()=>appReady);
 assert.equal(await page.locator('#voice').inputValue(),'');
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),null);
 flows.push('explicit default clears preference across reload');await context.close();

 ({context,page}=await open({voices:[],raw:JSON.stringify({uri:bob.voiceURI,name:bob.name,lang:bob.lang})}));
 await page.evaluate(voices=>window.__setVoices(voices),[alice,bob]);
 assert.equal(await page.locator('#voice').inputValue(),bob.voiceURI);
 flows.push('delayed voices restore persisted selection');await context.close();
 const renamed={...bob,voiceURI:'synthetic-renamed'};
 ({context,page}=await open({voices:[alice,renamed],raw:JSON.stringify({uri:bob.voiceURI,name:bob.name,lang:bob.lang})}));
 assert.equal(await page.locator('#voice').inputValue(),renamed.voiceURI);
 flows.push('changed URI falls back to matching name and language');await context.close();

 ({context,page}=await open({quota:true}));await page.locator('#voice').selectOption(bob.voiceURI);
 assert.equal(await page.locator('#voice').inputValue(),bob.voiceURI);
 assert.match(await page.locator('#voice-preference').innerText(),/No se pudo guardar/);
 await page.locator('#listen').click();assert.equal((await page.evaluate(()=>window.__spoken))[0].uri,bob.voiceURI);
 flows.push('quota failure warns and keeps session selection usable');await context.close();

 for(const raw of ['{broken',JSON.stringify({uri:'bad',name:'Bad',lang:'es-ES'})]){
  ({context,page}=await open({raw}));assert.equal(await page.locator('#voice').inputValue(),'');
  await page.locator('#voice').selectOption(alice.voiceURI);
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).uri,key),alice.voiceURI);
  await context.close();
 }
 flows.push('malformed and non-English preference recover through a valid choice');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({browser:await browser.version(),baseURL,flows:flows.length,passed:flows,pageErrors:errors},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
